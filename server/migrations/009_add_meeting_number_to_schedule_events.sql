-- Add meeting_number column to schedule_events
ALTER TABLE schedule_events
ADD COLUMN meeting_number INTEGER;

-- Create a function to automatically assign meeting numbers
CREATE OR REPLACE FUNCTION assign_meeting_numbers()
RETURNS void AS $$
DECLARE
    course_rec RECORD;
    event_rec RECORD;
    meeting_count INTEGER;
BEGIN
    FOR course_rec IN SELECT id FROM courses LOOP
        meeting_count := 1;
        FOR event_rec IN 
            SELECT id 
            FROM schedule_events 
            WHERE course_id = course_rec.id 
            AND status = 'scheduled'
            ORDER BY event_date, start_time
        LOOP
            UPDATE schedule_events
            SET meeting_number = meeting_count
            WHERE id = event_rec.id;
            
            meeting_count := meeting_count + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update existing data
SELECT assign_meeting_numbers();

-- Make the meeting_number column required for new events
ALTER TABLE schedule_events
ALTER COLUMN meeting_number SET NOT NULL;

-- Add a unique constraint to prevent duplicate meeting numbers for a course
ALTER TABLE schedule_events
ADD CONSTRAINT unique_meeting_number_per_course 
UNIQUE (course_id, meeting_number);
