import Joi from 'joi';
import multer from 'multer';
import path from 'path';

// Generic validation middleware
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'params' ? req.params : 
                 source === 'query' ? req.query : req.body;
    
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    // Replace original data with validated data
    if (source === 'params') req.params = value;
    else if (source === 'query') req.query = value;
    else req.body = value;
    
    next();
  };
};

// Schedule validation schemas
export const scheduleSchemas = {
  create: Joi.object({
    course_id: Joi.number().integer().positive().required(),
    room_id: Joi.number().integer().positive().required(),
    event_date: Joi.date().iso().required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    status: Joi.string().valid('default', 'changed', 'cancelled').default('changed'),
    notes: Joi.string().max(500).optional()
  }),
  
  update: Joi.object({
    room_id: Joi.number().integer().positive().optional(),
    event_date: Joi.date().iso().optional(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    status: Joi.string().valid('default', 'changed', 'cancelled').optional(),
    notes: Joi.string().max(500).optional()
  })
};

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'komting').required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    email: Joi.string().email().optional()
  })
};

// Course validation schemas
export const courseSchemas = {
  subscribe: Joi.object({
    course_id: Joi.number().integer().positive().required()
  })
};

// File upload validation
const allowedFileTypes = {
  materials: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'],
  images: ['.jpg', '.jpeg', '.png', '.gif']
};

export const fileUpload = (type = 'materials', maxSize = 10 * 1024 * 1024) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/${type}/`);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = allowedFileTypes[type] || allowedFileTypes.materials;
    
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: 5
    }
  });
};

// Time validation helper
export const validateTimeRange = (req, res, next) => {
  const { start_time, end_time } = req.body;
  
  if (start_time && end_time) {
    const start = new Date(`2000-01-01T${start_time}`);
    const end = new Date(`2000-01-01T${end_time}`);
    
    if (start >= end) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'End time must be after start time'
      });
    }
  }
  
  next();
};

// Date validation helper
export const validateFutureDate = (req, res, next) => {
  const { event_date } = req.body;
  
  if (event_date) {
    const eventDate = new Date(event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Event date cannot be in the past'
      });
    }
  }
  
  next();
};