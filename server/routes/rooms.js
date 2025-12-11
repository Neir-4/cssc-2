import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireKomting, validate, logActivity } from '../middleware/index.js';

const router = express.Router();



// Get all rooms
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT c.id, c.room_number as name, c.capacity, c.facilities as description,
             b.building_name as building, b.id as building_id
      FROM classrooms c
      LEFT JOIN buildings b ON c.building_id = b.id
      ORDER BY c.room_number
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM classrooms');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      rooms: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      error: 'Failed to get rooms',
      details: error.message
    });
  }
});

// Get available rooms for specific date and time range (FIXED LOGIC)
router.get('/available', async (req, res) => {
  try {
    const { date, start_time, end_time, min_capacity } = req.query;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Missing parameters',
        details: 'date, start_time, and end_time parameters are required'
      });
    }

    console.log('🔍 Checking room availability:', { date, start_time, end_time });

    // Get all rooms first
    const allRoomsQuery = `
      SELECT c.id, c.room_number as name, c.capacity, c.facilities as description,
             b.building_name as building
      FROM classrooms c
      LEFT JOIN buildings b ON c.building_id = b.id
      WHERE ($1::integer IS NULL OR c.capacity >= $1::integer)
      ORDER BY c.room_number
    `;
    
    const allRooms = await pool.query(allRoomsQuery, [min_capacity || null]);
    
    // Check each room individually for conflicts
    const availableRooms = [];
    const occupiedRooms = [];
    
    for (const room of allRooms.rows) {
      // Check if this specific room has conflicts
      const conflictQuery = `
        SELECT cs.id, c.course_name, cs.start_time, cs.end_time
        FROM class_schedules cs
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.room_id = $1
        AND cs.day_of_week = EXTRACT(DOW FROM $2::date)
        AND cs.start_time < $4::time 
        AND cs.end_time > $3::time
        
        UNION ALL
        
        SELECT se.id, c.course_name, se.start_time, se.end_time
        FROM schedule_events se
        JOIN courses c ON se.course_id = c.id
        WHERE se.room_id = $1
        AND se.event_date = $2::date
        AND se.status NOT IN ('cancelled', 'replaced')
        AND se.start_time < $4::time 
        AND se.end_time > $3::time
      `;
      
      const conflicts = await pool.query(conflictQuery, [room.id, date, start_time, end_time]);
      
      if (conflicts.rows.length === 0) {
        availableRooms.push({
          ...room,
          is_available: true
        });
      } else {
        occupiedRooms.push({
          ...room,
          is_available: false,
          conflict_reason: `Occupied by ${conflicts.rows[0].course_name} (${conflicts.rows[0].start_time}-${conflicts.rows[0].end_time})`
        });
      }
    }

    console.log(`📊 Room availability: ${availableRooms.length} available, ${occupiedRooms.length} occupied`);

    res.json({
      date,
      time_range: { start_time, end_time },
      available_rooms: availableRooms,
      occupied_rooms: occupiedRooms,
      total_available: availableRooms.length,
      total_occupied: occupiedRooms.length
    });

  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      error: 'Failed to get available rooms',
      details: error.message
    });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.id, c.room_number as name, c.capacity, c.facilities as description,
             b.building_name as building, b.id as building_id
      FROM classrooms c
      LEFT JOIN buildings b ON c.building_id = b.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Room not found',
        details: 'Room does not exist'
      });
    }

    res.json({ room: result.rows[0] });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      error: 'Failed to get room',
      details: error.message
    });
  }
});

// Get room status for specific date and time
router.get('/status', async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        error: 'Missing parameters',
        details: 'Both date and time parameters are required'
      });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        error: 'Invalid time format',
        details: 'Time must be in HH:MM format (24-hour)'
      });
    }

    // Get all rooms with their current status
    const roomsResult = await pool.query(`
      SELECT c.id, c.room_number as name, c.capacity, c.facilities as description,
             b.building_name as building,
             CASE 
               WHEN cs.id IS NOT NULL THEN 'occupied'
               ELSE 'available'
             END as status,
             cs.course_id, co.course_code, co.course_name,
             cs.start_time, cs.end_time, cs.lecturer_name
      FROM classrooms c
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN class_schedules cs ON c.id = cs.room_id 
        AND cs.day_of_week = EXTRACT(DOW FROM $1::date)
        AND cs.start_time <= $2::time 
        AND cs.end_time > $2::time
      LEFT JOIN courses co ON cs.course_id = co.id
      ORDER BY c.room_number
    `, [date, time]);

    const rooms = roomsResult.rows.map(room => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      floor: room.floor,
      building: room.building,
      description: room.description,
      status: room.status,
      current_event: room.status === 'occupied' ? {
        course_id: room.course_id,
        course_code: room.course_code,
        course_name: room.course_name,
        lecturer_name: room.lecturer_name,
        start_time: room.start_time,
        end_time: room.end_time
      } : null
    }));

    res.json({
      date,
      time,
      rooms,
      summary: {
        total_rooms: rooms.length,
        occupied_rooms: rooms.filter(r => r.status === 'occupied').length,
        available_rooms: rooms.filter(r => r.status === 'available').length
      }
    });

  } catch (error) {
    console.error('Get room status error:', error);
    res.status(500).json({
      error: 'Failed to get room status',
      details: error.message
    });
  }
});



// Get room schedule for a specific date
// Get daily schedule with room availability
router.get('/daily-schedule', authenticate, async (req, res) => {
  try {
    const { date, duration_minutes = 150 } = req.query;
    
    if (!date) {
      return res.status(400).json({
        error: 'Missing parameter',
        details: 'date parameter is required'
      });
    }

    // Get all time slots for the day (7:00 - 18:00)
    const timeSlots = [];
    for (let hour = 7; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = hour + Math.floor((minute + parseInt(duration_minutes)) / 60);
        const endMinute = (minute + parseInt(duration_minutes)) % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        if (endHour <= 18) {
          timeSlots.push({ start_time: startTime, end_time: endTime });
        }
      }
    }

    // For each time slot, get available rooms
    const scheduleData = [];
    for (const slot of timeSlots) {
      const roomsResult = await pool.query(`
        SELECT cl.id, cl.room_number as name, cl.capacity, cl.facilities,
               b.building_name as building,
               CASE WHEN cs.room_id IS NULL THEN true ELSE false END as is_available,
               c.course_code, c.course_name, cs.lecturer_name
        FROM classrooms cl
        LEFT JOIN buildings b ON cl.building_id = b.id
        LEFT JOIN class_schedules cs ON cl.id = cs.room_id 
          AND cs.day_of_week = EXTRACT(DOW FROM $1::date)
          AND cs.start_time < $3 AND cs.end_time > $2
        LEFT JOIN courses c ON cs.course_id = c.id
        ORDER BY cl.room_number
      `, [date, slot.start_time, slot.end_time]);

      const availableRooms = roomsResult.rows.filter(r => r.is_available);
      
      scheduleData.push({
        time_slot: slot,
        available_rooms: availableRooms,
        total_available: availableRooms.length,
        occupied_rooms: roomsResult.rows.filter(r => !r.is_available)
      });
    }

    res.json({
      date,
      duration_minutes: parseInt(duration_minutes),
      schedule: scheduleData
    });

  } catch (error) {
    console.error('Get daily schedule error:', error);
    res.status(500).json({
      error: 'Failed to get daily schedule',
      details: error.message
    });
  }
});

// Find available rooms for rescheduling
router.get('/available-for-reschedule', authenticate, async (req, res) => {
    console.log('Available for reschedule request:', req.query);
    try {
        const { 
            original_date, 
            original_start_time, 
            original_end_time,
            duration_minutes = 150,  // Default 2.5 hours
            from_date = new Date().toISOString().split('T')[0],  // Today
            to_date = '2025-12-05'  // End of semester
        } = req.query;

        // Validate required parameters
        if (!original_date || !original_start_time || !original_end_time) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'original_date, original_start_time, and original_end_time are required'
            });
        }

        // Convert duration to minutes
        const duration = parseInt(duration_minutes);
        if (isNaN(duration) || duration <= 0) {
            return res.status(400).json({
                error: 'Invalid duration',
                details: 'duration_minutes must be a positive number'
            });
        }

        // Format the original time for comparison
        const originalDateTime = `${original_date} ${original_start_time}`;
        
        // Validate date formats
        if (isNaN(Date.parse(original_date)) || isNaN(Date.parse(from_date)) || isNaN(Date.parse(to_date))) {
            return res.status(400).json({
                error: 'Invalid date format',
                details: 'Please provide dates in YYYY-MM-DD format'
            });
        }

        // Get all active rooms
        let roomsResult;
        try {
            roomsResult = await pool.query(`
                SELECT c.id, c.room_number as name, c.capacity, 
                       b.building_name as building, b.id as building_id
                FROM classrooms c
                LEFT JOIN buildings b ON c.building_id = b.id
                ORDER BY b.building_name, c.room_number
            `);
            console.log(`Found ${roomsResult.rows.length} active rooms`);
            
            if (!roomsResult.rows.length) {
                return res.status(404).json({
                    error: 'No active rooms found',
                    details: 'There are no active rooms available in the system'
                });
            }
        } catch (roomError) {
            console.error('Error fetching rooms:', roomError);
            return res.status(500).json({
                error: 'Failed to fetch rooms',
                details: roomError.message
            });
        }

        const availableSlots = [];

        // Check each room
        for (const room of roomsResult.rows) {
            // Get all scheduled events for this room in the date range
            let eventsResult;
            try {
                eventsResult = await pool.query(`
                    SELECT 
                        cs.day_of_week,
                        cs.start_time, 
                        cs.end_time,
                        c.course_name
                    FROM class_schedules cs
                    LEFT JOIN courses c ON cs.course_id = c.id
                    WHERE cs.room_id = $1
                    ORDER BY cs.day_of_week, cs.start_time
                `, [room.id]);
                console.log(`Found ${eventsResult.rows.length} scheduled events for room ${room.id}`);
            } catch (eventError) {
                console.error(`Error fetching events for room ${room.id}:`, eventError);
                // Continue to next room if there's an error with this one
                continue;
            }

            const bookedSlots = eventsResult.rows;

            // Convert to Date objects for easier comparison
            const checkDate = new Date(from_date);
            const endDate = new Date(to_date);
            
            // Check each day in the range
            while (checkDate <= endDate) {
                const currentDate = checkDate.toISOString().split('T')[0];
                const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

                // Skip weekends
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    checkDate.setDate(checkDate.getDate() + 1);
                    continue;
                }

                // Check time slots from 07:00 to 18:00
                for (let hour = 7; hour <= 18; hour++) {
                    for (let minute = 0; minute < 60; minute += 30) { // Check every 30 minutes
                        const startTime = new Date(checkDate);
                        startTime.setHours(hour, minute, 0, 0);
                        
                        const endTime = new Date(startTime.getTime() + duration * 60000);
                        
                        // Skip if end time is after 18:00
                        if (endTime.getHours() > 18 || 
                            (endTime.getHours() === 18 && endTime.getMinutes() > 0)) {
                            continue;
                        }

                        // Skip if this is the original time slot
                        if (currentDate === original_date && 
                            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` === original_start_time) {
                            continue;
                        }

                        // Check for conflicts with weekly schedule
                        const hasConflict = bookedSlots.some(event => {
                            // Convert day_of_week (1=Monday, 7=Sunday) to JS day (0=Sunday, 6=Saturday)
                            const eventDayOfWeek = event.day_of_week === 7 ? 0 : event.day_of_week;
                            
                            if (dayOfWeek !== eventDayOfWeek) {
                                return false;
                            }
                            
                            const eventStart = new Date(`2000-01-01T${event.start_time}`);
                            const eventEnd = new Date(`2000-01-01T${event.end_time}`);
                            const slotStart = new Date(`2000-01-01T${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`);
                            const slotEnd = new Date(`2000-01-01T${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`);
                            
                            return (slotStart < eventEnd && slotEnd > eventStart);
                        });

                        if (!hasConflict) {
                            availableSlots.push({
                                room_id: room.id,
                                room_name: room.name,
                                building: room.building,
                                building_id: room.building_id,
                                date: currentDate,
                                start_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                                end_time: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
                                duration_minutes: duration
                            });
                        }
                    }
                }

                checkDate.setDate(checkDate.getDate() + 1);
            }
        }

        // Group by date and time for better presentation
        const groupedSlots = availableSlots.reduce((acc, slot) => {
            const key = `${slot.date}_${slot.start_time}_${slot.end_time}`;
            if (!acc[key]) {
                acc[key] = {
                    date: slot.date,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    duration_minutes: slot.duration_minutes,
                    available_rooms: []
                };
            }
            acc[key].available_rooms.push({
                room_id: slot.room_id,
                room_name: slot.room_name,
                building: slot.building,
                building_id: slot.building_id
            });
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(groupedSlots)
        });

    } catch (error) {
        console.error('Error in available-for-reschedule endpoint:', {
            error: error.message,
            stack: error.stack,
            query: req.query,
            user: req.user?.id
        });
        
        // More specific error messages based on error type
        let errorMessage = 'Internal server error';
        let statusCode = 500;
        
        if (error.message.includes('invalid input syntax for type date')) {
            errorMessage = 'Invalid date format';
            statusCode = 400;
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
            errorMessage = 'Database table not found';
            statusCode = 500;
        }
        
        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
        });
    }
});

// Get room schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Missing parameter',
        details: 'date parameter is required'
      });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Check if room exists
    const roomResult = await pool.query(
      'SELECT c.id, c.room_number as name, c.capacity, c.facilities as description, b.building_name as building FROM classrooms c LEFT JOIN buildings b ON c.building_id = b.id WHERE c.id = $1',
      [id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Room not found',
        details: 'Room does not exist or is inactive'
      });
    }

    const room = roomResult.rows[0];

    // Get room schedule for the date
    const scheduleResult = await pool.query(`
      SELECT cs.id, cs.start_time, cs.end_time, cs.day_of_week,
             c.id as course_id, c.course_code, c.course_name,
             cs.lecturer_name, cs.created_at
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.room_id = $1 
      AND cs.day_of_week = EXTRACT(DOW FROM $2::date)
      ORDER BY cs.start_time
    `, [id, date]);

    const events = scheduleResult.rows.map(event => ({
      id: event.id,
      course: {
        id: event.course_id,
        code: event.course_code,
        name: event.course_name
      },
      lecturer_name: event.lecturer_name,
      time: `${event.start_time} - ${event.end_time}`,
      start_time: event.start_time,
      end_time: event.end_time,
      day_of_week: event.day_of_week,
      created_at: event.created_at
    }));

    res.json({
      room,
      date,
      events,
      total_events: events.length
    });

  } catch (error) {
    console.error('Get room schedule error:', error);
    res.status(500).json({
      error: 'Failed to get room schedule',
      details: error.message
    });
  }
});

// Create new room (komting only)
router.post('/', authenticate, requireKomting, logActivity('ROOM_CREATE'), async (req, res) => {
  try {
    const { name, capacity, floor, building, description } = req.body;

    // Check if room name already exists
    const existingRoom = await pool.query(
      'SELECT id FROM classrooms WHERE LOWER(room_number) = LOWER($1)',
      [name]
    );

    if (existingRoom.rows.length > 0) {
      return res.status(409).json({
        error: 'Room name already exists',
        details: 'This room name is already in use'
      });
    }

    // Create room
    const result = await pool.query(
      `INSERT INTO classrooms (room_number, capacity, facilities)
       VALUES ($1, $2, $3)
       RETURNING id, room_number as name, capacity, facilities as description`,
      [name, capacity || null, description || null]
    );

    const room = result.rows[0];

    res.status(201).json({
      message: 'Room created successfully',
      room
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      error: 'Failed to create room',
      details: error.message
    });
  }
});

export default router;
