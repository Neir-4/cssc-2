-- Generate 16 schedule events for each course (weekly meetings from Aug 20 to Dec 5, 2025)

-- First, clear any existing schedule events to avoid duplicates
DELETE FROM schedule_events;

-- Generate schedule events for all active courses
INSERT INTO schedule_events (course_id, room_id, event_date, start_time, end_time, status)
SELECT 
  c.id,
  c.default_room_id,
  generate_series(
    '2025-08-20'::DATE, -- Start date: Wednesday, Aug 20, 2025
    '2025-12-05'::DATE, -- End date: Friday, Dec 5, 2025 (16th meeting)
    CASE 
      WHEN c.default_day = 1 THEN '7 days'::INTERVAL  -- Monday
      WHEN c.default_day = 2 THEN '7 days'::INTERVAL  -- Tuesday
      WHEN c.default_day = 3 THEN '7 days'::INTERVAL  -- Wednesday
      WHEN c.default_day = 4 THEN '7 days'::INTERVAL  -- Thursday
      WHEN c.default_day = 5 THEN '7 days'::INTERVAL  -- Friday
      WHEN c.default_day = 6 THEN '7 days'::INTERVAL  -- Saturday
      WHEN c.default_day = 7 THEN '7 days'::INTERVAL  -- Sunday
    END
  ) as event_date,
  c.default_start_time,
  c.default_end_time,
  'scheduled'
FROM courses c 
WHERE c.is_active = true
AND c.default_room_id IS NOT NULL;

-- Verify the generated events
SELECT 
  c.name as course_name,
  c.credits,
  COUNT(se.id) as meeting_count,
  MIN(se.event_date) as first_meeting,
  MAX(se.event_date) as last_meeting
FROM courses c
LEFT JOIN schedule_events se ON c.id = se.course_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.credits
ORDER BY c.name;
