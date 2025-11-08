const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { validate } = require('../middleware/validator');

/**
 * @swagger
 * /v1/doctors:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - specialization
 *               - license_number
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. John Smith
 *               email:
 *                 type: string
 *                 example: john.smith@hospital.com
 *               phone:
 *                 type: string
 *                 example: '9876543210'
 *               specialization:
 *                 type: string
 *                 example: Cardiology
 *               license_number:
 *                 type: string
 *                 example: MED123456
 *               experience_years:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       409:
 *         description: Email or license already exists
 */
// router.post('/', validate('createDoctor'), doctorController.createDoctor);

/**
 * @swagger
 * /v1/doctors:
 *   get:
 *     summary: Get all doctors with pagination
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/', doctorController.getDoctors);

/**
 * @swagger
 * /v1/doctors/search:
 *   get:
 *     summary: Search doctors by name, specialization, or availability
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 */
// router.get('/search', validate('searchQuery'), doctorController.searchDoctors);

/**
 * @swagger
 * /v1/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/:id', doctorController.getDoctor);

/**
 * @swagger
 * /v1/doctors/{id}:
 *   put:
 *     summary: Update doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               specialization:
 *                 type: string
 *               experience_years:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 */
// router.put('/:id', validate('updateDoctor'), doctorController.updateDoctor);

/**
 * @swagger
 * /v1/doctors/{id}:
 *   delete:
 *     summary: Delete doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 */
// router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;
