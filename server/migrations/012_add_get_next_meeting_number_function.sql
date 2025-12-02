-- Create function to get the next available meeting number for a course
CREATE OR REPLACE FUNCTION get_next_meeting_number(p_course_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_next_number INTEGER;
    v_max_meetings INTEGER;
BEGIN
    -- Get the next available meeting number
    SELECT COALESCE(MAX(meeting_number), 0) + 1 INTO v_next_number
    FROM schedule_events
    WHERE course_id = p_course_id
    AND status = 'scheduled';
    
    -- Get the maximum allowed meetings for the course
    SELECT total_meetings INTO v_max_meetings
    FROM courses
    WHERE id = p_course_id;
    
    -- Check if we've reached the maximum number of meetings
    IF v_next_number > v_max_meetings THEN
        RAISE EXCEPTION 'Maximum number of meetings (%) reached for this course', v_max_meetings;
    END IF;
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;
