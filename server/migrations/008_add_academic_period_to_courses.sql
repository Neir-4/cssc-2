-- Add academic period and meeting limit to courses
ALTER TABLE courses
ADD COLUMN academic_start_date DATE,
ADD COLUMN academic_end_date DATE,
ADD COLUMN total_meetings INTEGER NOT NULL DEFAULT 16,
ADD COLUMN meetings_held INTEGER NOT NULL DEFAULT 0;

-- Update existing courses with the current academic period
UPDATE courses 
SET 
    academic_start_date = '2025-08-18',
    academic_end_date = '2025-12-05',
    total_meetings = 16,
    meetings_held = (
        SELECT COUNT(*) 
        FROM schedule_events 
        WHERE course_id = courses.id 
        AND status = 'scheduled'
    );

-- Make the date columns required for new courses
ALTER TABLE courses 
ALTER COLUMN academic_start_date SET NOT NULL,
ALTER COLUMN academic_end_date SET NOT NULL;
