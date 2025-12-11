// Date validation middleware for schedule operations
export const validateScheduleDate = (req, res, next) => {
  const { newDate, event_date } = req.body;
  const dateToValidate = newDate || event_date;
  
  if (!dateToValidate) {
    return res.status(400).json({
      error: 'Date required',
      details: 'Event date is required for schedule operations'
    });
  }
  
  const eventDate = new Date(dateToValidate);
  const today = new Date();
  const maxDate = new Date('2025-12-05');
  
  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  maxDate.setHours(23, 59, 59, 999);
  
  if (isNaN(eventDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format',
      details: 'Please provide date in YYYY-MM-DD format'
    });
  }
  
  if (eventDate < today) {
    return res.status(400).json({
      error: 'Invalid date',
      details: 'Cannot schedule events in the past'
    });
  }
  
  if (eventDate > maxDate) {
    return res.status(400).json({
      error: 'Date out of range',
      details: 'Schedule can only be created until December 5, 2025'
    });
  }
  
  next();
};

// Time validation middleware
export const validateScheduleTime = (req, res, next) => {
  const { newStartTime, newEndTime, start_time, end_time } = req.body;
  const startTime = newStartTime || start_time;
  const endTime = newEndTime || end_time;
  
  if (!startTime || !endTime) {
    return res.status(400).json({
      error: 'Time required',
      details: 'Both start time and end time are required'
    });
  }
  
  // Validate time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({
      error: 'Invalid time format',
      details: 'Time must be in HH:MM format (24-hour)'
    });
  }
  
  // Validate time range
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  if (start >= end) {
    return res.status(400).json({
      error: 'Invalid time range',
      details: 'End time must be after start time'
    });
  }
  
  // Validate business hours (7:00 - 23:00)
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  if (startHour < 7 || endHour > 23) {
    return res.status(400).json({
      error: 'Time out of range',
      details: 'Schedule must be between 07:00 and 23:00'
    });
  }
  
  next();
};