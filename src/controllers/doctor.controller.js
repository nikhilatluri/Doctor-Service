const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class DoctorController {
  async createDoctor(req, res, next) {
    try {
      const { name, email, phone, department, specialization, max_appointments_per_day = 20 } = req.body;

      // Check if doctor already exists
      const existingDoctor = await pool.query(
        'SELECT doctor_id FROM doctors WHERE email = $1',
        [email]
      );

      if (existingDoctor.rows.length > 0) {
        throw new AppError('Doctor with this email already exists', 409);
      }

      const result = await pool.query(
        `INSERT INTO doctors (name, email, phone, department, specialization, max_appointments_per_day, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
         RETURNING doctor_id, name, email, phone, department, specialization, max_appointments_per_day, status, created_at`,
        [name, email, phone, department, specialization, max_appointments_per_day]
      );

      logger.info('Doctor created', {
        correlationId: req.correlationId,
        doctorId: result.rows[0].doctor_id
      });

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: result.rows[0],
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async getDoctors(req, res, next) {
    try {
      const { department, specialization, status = 'ACTIVE', page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const conditions = ['status = $1'];
      const values = [status];
      let paramCount = 1;

      if (department) {
        paramCount++;
        conditions.push(`department = $${paramCount}`);
        values.push(department);
      }

      if (specialization) {
        paramCount++;
        conditions.push(`specialization = $${paramCount}`);
        values.push(specialization);
      }

      const whereClause = conditions.join(' AND ');

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM doctors WHERE ${whereClause}`,
        values
      );
      const totalCount = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT doctor_id, name, email, phone, department, specialization, status, max_appointments_per_day, created_at
         FROM doctors
         WHERE ${whereClause}
         ORDER BY name
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...values, limit, offset]
      );

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async getDoctor(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT doctor_id, name, email, phone, department, specialization, status, max_appointments_per_day, created_at
         FROM doctors WHERE doctor_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return next(new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND'));
      }

      res.json({
        success: true,
        data: result.rows[0],
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(req, res, next) {
    try {
      const result = await pool.query(
        `SELECT DISTINCT department, COUNT(*) as doctor_count
         FROM doctors
         WHERE status = 'ACTIVE'
         GROUP BY department
         ORDER BY department`
      );

      res.json({
        success: true,
        data: result.rows,
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async checkSlotAvailability(req, res, next) {
    try {
      const { doctorId, date, startTime, endTime } = req.query;

      if (!doctorId || !date || !startTime || !endTime) {
        return next(new AppError('Missing required parameters', 400, 'MISSING_PARAMETERS'));
      }

      // Check if doctor exists and is active
      const doctorResult = await pool.query(
        'SELECT doctor_id, status, department, max_appointments_per_day FROM doctors WHERE doctor_id = $1',
        [doctorId]
      );

      if (doctorResult.rows.length === 0) {
        return next(new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND'));
      }

      if (doctorResult.rows[0].status !== 'ACTIVE') {
        return res.json({
          success: true,
          available: false,
          reason: 'Doctor is not active',
          correlationId: req.correlationId
        });
      }

      // Check if slot falls within clinic hours
      const clinicOpenHour = parseInt(process.env.CLINIC_OPEN_HOUR) || 9;
      const clinicCloseHour = parseInt(process.env.CLINIC_CLOSE_HOUR) || 17;
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);

      if (startHour < clinicOpenHour || endHour > clinicCloseHour) {
        return res.json({
          success: true,
          available: false,
          reason: `Slot must be within clinic hours (${clinicOpenHour}:00 - ${clinicCloseHour}:00)`,
          correlationId: req.correlationId
        });
      }

      // Check for overlapping slots
      const slotResult = await pool.query(
        `SELECT slot_id FROM doctor_slots
         WHERE doctor_id = $1
         AND slot_date = $2
         AND status = 'BOOKED'
         AND (
           (slot_start < $4 AND slot_end > $3) OR
           (slot_start >= $3 AND slot_start < $4)
         )`,
        [doctorId, date, startTime, endTime]
      );

      if (slotResult.rows.length > 0) {
        return res.json({
          success: true,
          available: false,
          reason: 'Slot overlaps with existing appointment',
          correlationId: req.correlationId
        });
      }

      // Check daily appointment limit
      const dailyCount = await pool.query(
        `SELECT COUNT(*) FROM doctor_slots
         WHERE doctor_id = $1
         AND slot_date = $2
         AND status = 'BOOKED'`,
        [doctorId, date]
      );

      const maxAppointments = doctorResult.rows[0].max_appointments_per_day;
      if (parseInt(dailyCount.rows[0].count) >= maxAppointments) {
        return res.json({
          success: true,
          available: false,
          reason: `Doctor has reached maximum appointments for the day (${maxAppointments})`,
          correlationId: req.correlationId
        });
      }

      res.json({
        success: true,
        available: true,
        doctor: doctorResult.rows[0],
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req, res, next) {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return next(new AppError('Doctor ID and date are required', 400, 'MISSING_PARAMETERS'));
      }

      // Get doctor info
      const doctorResult = await pool.query(
        'SELECT doctor_id, name, department FROM doctors WHERE doctor_id = $1 AND status = $\'ACTIVE\'',
        [doctorId]
      );

      if (doctorResult.rows.length === 0) {
        return next(new AppError('Doctor not found or not active', 404, 'DOCTOR_NOT_FOUND'));
      }

      // Get booked slots
      const bookedSlots = await pool.query(
        `SELECT slot_start, slot_end FROM doctor_slots
         WHERE doctor_id = $1 AND slot_date = $2 AND status = 'BOOKED'
         ORDER BY slot_start`,
        [doctorId, date]
      );

      // Generate available slots
      const clinicOpenHour = parseInt(process.env.CLINIC_OPEN_HOUR) || 9;
      const clinicCloseHour = parseInt(process.env.CLINIC_CLOSE_HOUR) || 17;
      const slotDuration = parseInt(process.env.SLOT_DURATION_MINUTES) || 30;

      const availableSlots = [];
      const bookedTimes = bookedSlots.rows.map(s => ({ start: s.slot_start, end: s.slot_end }));

      for (let hour = clinicOpenHour; hour < clinicCloseHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          const endMinute = minute + slotDuration;
          const endHour = hour + Math.floor(endMinute / 60);
          const endMin = endMinute % 60;
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

          if (endHour > clinicCloseHour) break;

          // Check if slot overlaps with booked slots
          const isBooked = bookedTimes.some(booked =>
            (startTime < booked.end && endTime > booked.start)
          );

          if (!isBooked) {
            availableSlots.push({ start: startTime, end: endTime });
          }
        }
      }

      res.json({
        success: true,
        doctor: doctorResult.rows[0],
        date,
        availableSlots,
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();
