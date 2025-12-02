-- Update courses with current semester information
UPDATE courses
SET 
    academic_year = '2025/2026',
    semester = 'Ganjil'
WHERE academic_year IS NULL;

-- Add comments to the new columns
COMMENT ON COLUMN courses.academic_start_date IS 'Start date of the academic period for this course';
COMMENT ON COLUMN courses.academic_end_date IS 'End date of the academic period for this course';
COMMENT ON COLUMN courses.total_meetings IS 'Total number of meetings scheduled for this course';
COMMENT ON COLUMN courses.meetings_held IS 'Number of meetings that have already been held';

-- Update the meetings_held count for all courses
UPDATE courses c
SET meetings_held = (
    SELECT COUNT(*) 
    FROM schedule_events se 
    WHERE se.course_id = c.id 
    AND se.status = 'scheduled'
    AND se.event_date <= CURRENT_DATE
);
