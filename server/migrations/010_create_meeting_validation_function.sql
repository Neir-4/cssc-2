-- Create function to validate meeting dates and numbers
CREATE OR REPLACE FUNCTION validate_meeting_date(
    p_course_id INTEGER,
    p_proposed_date DATE,
    p_meeting_number INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_academic_start DATE;
    v_academic_end DATE;
    v_meeting_count INTEGER;
    v_max_meetings INTEGER;
    v_is_valid BOOLEAN;
BEGIN
    -- Get the academic period for the course
    SELECT academic_start_date, academic_end_date, total_meetings
    INTO v_academic_start, v_academic_end, v_max_meetings
    FROM courses
    WHERE id = p_course_id;
    
    -- Check if the proposed date is within the academic period
    IF p_proposed_date < v_academic_start OR p_proposed_date > v_academic_end THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the meeting number is within the allowed range
    IF p_meeting_number < 1 OR p_meeting_number > v_max_meetings THEN
        RETURN FALSE;
    END IF;
    
    -- Check if this meeting number already exists for this course
    SELECT COUNT(*) > 0 INTO v_is_valid
    FROM schedule_events
    WHERE course_id = p_course_id
    AND meeting_number = p_meeting_number
    AND status = 'scheduled';
    
    RETURN NOT v_is_valid;
END;
$$ LANGUAGE plpgsql;
