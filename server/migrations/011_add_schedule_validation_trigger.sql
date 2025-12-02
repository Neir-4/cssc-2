-- Create trigger function to validate schedule events
CREATE OR REPLACE FUNCTION validate_schedule_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate for new scheduled events
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'scheduled') THEN
        -- Check if the date is within the academic period and meeting number is valid
        IF NOT validate_meeting_date(
            NEW.course_id, 
            NEW.event_date,
            NEW.meeting_number
        ) THEN
            RAISE EXCEPTION 'Invalid meeting date or meeting number for this course';
        END IF;
        
        -- Check if the meeting number is within the allowed range
        DECLARE
            v_max_meetings INTEGER;
        BEGIN
            SELECT total_meetings INTO v_max_meetings
            FROM courses
            WHERE id = NEW.course_id;
            
            IF NEW.meeting_number < 1 OR NEW.meeting_number > v_max_meetings THEN
                RAISE EXCEPTION 'Meeting number must be between 1 and %', v_max_meetings;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_validate_schedule_event ON schedule_events;
CREATE TRIGGER tr_validate_schedule_event
BEFORE INSERT OR UPDATE ON schedule_events
FOR EACH ROW EXECUTE FUNCTION validate_schedule_event();
