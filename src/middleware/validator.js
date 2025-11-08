const Joi = require('joi');
const { AppError } = require('./errorHandler');

const schemas = {
  createPatient: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    dob: Joi.date().max('now').required()
  }),

  updatePatient: Joi.object({
    name: Joi.string().min(2).max(255),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    dob: Joi.date().max('now'),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
  }).min(1),

  searchQuery: Joi.object({
    name: Joi.string().min(1),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    email: Joi.string().email(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }).min(1)
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new AppError('Validation schema not found', 500));
    }

    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }

    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

module.exports = { validate };
