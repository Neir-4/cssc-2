import pool from '../config/database.js';

// Activity logging middleware
export const logActivity = (action, resource = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log after successful response
      if (res.statusCode < 400) {
        logToDatabase(req, action, resource, res.statusCode);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Log sensitive operations to database
const logToDatabase = async (req, action, resource, statusCode) => {
  try {
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || 'anonymous';
    const userRole = req.user?.role || 'guest';
    
    await pool.query(`
      INSERT INTO activity_logs (
        user_id, user_email, user_role, action, resource, 
        method, path, ip_address, user_agent, status_code, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      userId, userEmail, userRole, action, resource,
      req.method, req.path, req.ip, req.get('User-Agent'), statusCode
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`🚨 Unauthorized access attempt: ${req.ip} -> ${req.method} ${req.path}`);
    }
  });
  
  next();
};

// Security event logging
export const logSecurityEvent = async (event, details, req = null) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      userId: req?.user?.id || null,
      userEmail: req?.user?.email || null
    };
    
    console.warn(`🔒 SECURITY EVENT: ${event}`, logEntry);
    
    // Store in database if available
    await pool.query(`
      INSERT INTO security_logs (event, details, ip_address, user_agent, user_id, user_email, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [event, JSON.stringify(details), logEntry.ip, logEntry.userAgent, logEntry.userId, logEntry.userEmail]);
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// File operation logging
export const logFileOperation = (operation) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode < 400 && req.user) {
        const fileInfo = {
          operation,
          filename: req.file?.filename || req.body?.filename,
          originalName: req.file?.originalname,
          size: req.file?.size,
          mimetype: req.file?.mimetype
        };
        
        logToDatabase(req, `FILE_${operation.toUpperCase()}`, JSON.stringify(fileInfo), res.statusCode);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};