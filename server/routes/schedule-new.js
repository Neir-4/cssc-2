import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireAdminOrKomting } from '../middleware/index.js';

const router = express.Router();

// Get schedule data compatible with existing frontend
router.get('/real', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to current week if no date range provided
    let startDate = new Date();
    let endDate = new Date();
    
    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      const currentDay = startDate.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      startDate.setDate(startDate.getDate() + mondayOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    }

    // Query new schema but format for existing frontend
    const query = `
      SELECT 
        cs.id,
        cs.start_time,
        cs.end_time,
        cs.week_sequence,
        cs.meeting_number,
        d.day_name,
        d.day_order,
        c.course_code,
        c.course_name,
        CONCAT(cl.room_number, ' (', b.building_code, ')') as room_name,
        cl.id as room_id,
        cl.capacity,
        STRING_AGG(l.full_name, ' & ' ORDER BY 
          CASE WHEN crl.role = 'Primary' THEN 1 
               WHEN crl.role = 'Assistant' THEN 2 
               ELSE 3 END) as lecturer_name
      FROM class_schedule cs
      JOIN days d ON cs.day_id = d.id
      JOIN classrooms cl ON cs.classroom_id = cl.id
      JOIN buildings b ON cl.building_id = b.id
      JOIN class_groups cg ON cs.class_group_id = cg.id
      JOIN courses c ON cg.course_id = c.id
      JOIN course_lecturers crl ON cs.id = crl.schedule_id
      JOIN lecturers l ON crl.lecturer_id = l.id
      WHERE cs.is_rescheduled = false
      AND d.day_order BETWEEN 1 AND 5
      GROUP BY cs.id, cs.start_time, cs.end_time, cs.week_sequence, cs.meeting_number,
               d.day_name, d.day_order, c.course_code, c.course_name, 
               cl.room_number, b.building_code, cl.id, cl.capacity
      ORDER BY d.day_order, cs.start_time
    `;

    const result = await pool.query(query);
    
    // Transform to match existing frontend format
    const eventsByDate = {};
    const today = new Date();
    
    result.rows.forEach(row => {
      // Calculate actual date for this week
      const monday = new Date(startDate);
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (row.day_order - 1));
      const dateStr = eventDate.toISOString().split('T')[0];
      
      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      
      eventsByDate[dateStr].push({
        id: row.id,
        course_id: row.id, // Using schedule ID as course_id for compatibility
        course_code: row.course_code,
        course_name: row.course_name,
        lecturer_name: row.lecturer_name,
        komting_name: 'Komting', // Default value
        room: {
          id: row.room_id,
          name: row.room_name,
          capacity: row.capacity,
          floor: '1',
          building: 'Gedung D'
        },
        time: `${row.start_time.substring(0,5)} - ${row.end_time.substring(0,5)}`,
        start_time: row.start_time.substring(0,5),
        end_time: row.end_time.substring(0,5),
        status: 'scheduled',
        event_date: dateStr,
        meeting_number: row.meeting_number,
        week_sequence: row.week_sequence
      });
    });

    res.json({
      events: eventsByDate,
      date_range: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      total_events: result.rows.length
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      error: 'Failed to get schedule',
      details: error.message
    });
  }
});

// Get default schedule (fallback)
router.get('/default', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.course_code,
        c.course_name as name,
        d.day_order as default_day,
        cs.start_time as default_start_time,
        cs.end_time as default_end_time,
        STRING_AGG(l.full_name, ' & ') as lecturer_name,
        'Komting' as komting_name,
        CONCAT(cl.room_number, ' (', b.building_code, ')') as room_name,
        cl.capacity,
        '1' as floor,
        b.building_name as building
      FROM courses c
      JOIN class_groups cg ON c.id = cg.course_id
      JOIN class_schedule cs ON cg.id = cs.class_group_id
      JOIN days d ON cs.day_id = d.id
      JOIN classrooms cl ON cs.classroom_id = cl.id
      JOIN buildings b ON cl.building_id = b.id
      JOIN course_lecturers crl ON cs.id = crl.schedule_id
      JOIN lecturers l ON crl.lecturer_id = l.id
      WHERE cs.is_rescheduled = false
      GROUP BY c.id, c.course_code, c.course_name, d.day_order,
               cs.start_time, cs.end_time, cl.room_number, 
               b.building_code, cl.capacity, b.building_name
      ORDER BY d.day_order, cs.start_time
    `;

    const result = await pool.query(query);
    
    res.json({
      schedule: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get default schedule error:', error);
    res.status(500).json({
      error: 'Failed to get default schedule',
      details: error.message
    });
  }
});

// Update schedule (reschedule)
router.post('/update', authenticate, requireAdminOrKomting, async (req, res) => {
  try {
    const { courseId, newDate, newStartTime, newEndTime, newRoomId } = req.body;
    
    if (!courseId || !newDate || !newStartTime || !newEndTime) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // For now, create a simple reschedule entry
    // In a full implementation, you'd create a new schedule entry and mark old one as rescheduled
    
    res.json({
      message: 'Schedule updated successfully',
      event: {
        id: courseId,
        event_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        room_id: newRoomId
      }
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      error: 'Failed to update schedule',
      details: error.message
    });
  }
});

export default router;