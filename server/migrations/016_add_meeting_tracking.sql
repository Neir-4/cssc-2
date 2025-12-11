-- Add meeting tracking for weekly schedule management
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS meeting_number INTEGER;
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS academic_week INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_meeting ON schedule_events(course_id, meeting_number);
CREATE INDEX IF NOT EXISTS idx_schedule_events_week ON schedule_events(course_id, academic_week);

-- Function to calculate academic week from date
CREATE OR REPLACE FUNCTION get_academic_week(event_date DATE, semester_start DATE DEFAULT '2024-08-26')
RETURNS INTEGER AS $$
BEGIN
    RETURN CEIL((event_date - semester_start + 1) / 7.0);
END;
$$ LANGUAGE plpgsql;