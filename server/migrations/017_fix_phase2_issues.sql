-- Phase 2 fixes: Ensure database supports weekly scheduling and meeting sequences

-- Ensure academic_week and meeting_number columns exist
ALTER TABLE schedule_events 
ADD COLUMN IF NOT EXISTS academic_week INTEGER,
ADD COLUMN IF NOT EXISTS meeting_number INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_academic_week ON schedule_events(course_id, academic_week);
CREATE INDEX IF NOT EXISTS idx_schedule_events_meeting_number ON schedule_events(course_id, meeting_number);

-- Update existing events with calculated academic weeks
UPDATE schedule_events 
SET academic_week = CEIL(EXTRACT(EPOCH FROM (event_date - DATE '2024-08-26')) / (7 * 24 * 60 * 60))
WHERE academic_week IS NULL AND event_date IS NOT NULL;

-- Update existing events with meeting numbers
WITH numbered_events AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY event_date, start_time) as meeting_seq
  FROM schedule_events 
  WHERE meeting_number IS NULL AND status NOT IN ('cancelled', 'replaced')
)
UPDATE schedule_events 
SET meeting_number = numbered_events.meeting_seq
FROM numbered_events 
WHERE schedule_events.id = numbered_events.id;

-- Add constraint to ensure meeting numbers are within valid range (1-16)
ALTER TABLE schedule_events 
ADD CONSTRAINT chk_meeting_number_range 
CHECK (meeting_number IS NULL OR (meeting_number >= 1 AND meeting_number <= 16));

-- Function to get next available meeting number
CREATE OR REPLACE FUNCTION get_next_meeting_number(p_course_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(meeting_number), 0) + 1 INTO v_next_number
    FROM schedule_events
    WHERE course_id = p_course_id
    AND status NOT IN ('cancelled', 'replaced');
    
    -- Ensure we don't exceed 16 meetings
    IF v_next_number > 16 THEN
        RETURN NULL; -- Indicate no more meetings available
    END IF;
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate academic week from date
CREATE OR REPLACE FUNCTION calculate_academic_week(event_date DATE, semester_start DATE DEFAULT '2024-08-26')
RETURNS INTEGER AS $$
BEGIN
    RETURN CEIL(EXTRACT(EPOCH FROM (event_date - semester_start)) / (7 * 24 * 60 * 60));
END;
$$ LANGUAGE plpgsql;