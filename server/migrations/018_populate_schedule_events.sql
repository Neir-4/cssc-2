-- Populate schedule events for current week (Week 68)
-- This creates actual schedule events based on the default course schedules

INSERT INTO schedule_events (course_id, room_id, event_date, start_time, end_time, status, academic_week, meeting_number, created_at)
SELECT 
    c.id as course_id,
    c.default_room_id as room_id,
    CASE 
        WHEN c.default_day = 1 THEN '2024-12-09'::date  -- Monday
        WHEN c.default_day = 2 THEN '2024-12-10'::date  -- Tuesday  
        WHEN c.default_day = 3 THEN '2024-12-11'::date  -- Wednesday
        WHEN c.default_day = 4 THEN '2024-12-12'::date  -- Thursday
        WHEN c.default_day = 5 THEN '2024-12-13'::date  -- Friday
    END as event_date,
    c.default_start_time,
    c.default_end_time,
    'scheduled' as status,
    68 as academic_week,
    1 as meeting_number,
    NOW() as created_at
FROM courses c
WHERE c.is_active = true 
AND c.default_day BETWEEN 1 AND 5  -- Only weekdays
AND c.default_room_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also create events for next week (Week 69)
INSERT INTO schedule_events (course_id, room_id, event_date, start_time, end_time, status, academic_week, meeting_number, created_at)
SELECT 
    c.id as course_id,
    c.default_room_id as room_id,
    CASE 
        WHEN c.default_day = 1 THEN '2024-12-16'::date  -- Monday
        WHEN c.default_day = 2 THEN '2024-12-17'::date  -- Tuesday  
        WHEN c.default_day = 3 THEN '2024-12-18'::date  -- Wednesday
        WHEN c.default_day = 4 THEN '2024-12-19'::date  -- Thursday
        WHEN c.default_day = 5 THEN '2024-12-20'::date  -- Friday
    END as event_date,
    c.default_start_time,
    c.default_end_time,
    'scheduled' as status,
    69 as academic_week,
    2 as meeting_number,
    NOW() as created_at
FROM courses c
WHERE c.is_active = true 
AND c.default_day BETWEEN 1 AND 5  -- Only weekdays
AND c.default_room_id IS NOT NULL
ON CONFLICT DO NOTHING;