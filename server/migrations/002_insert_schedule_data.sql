-- Insert schedule data for current semester
DO $$
DECLARE
    academic_year_id INTEGER;
    monday_id INTEGER;
    tuesday_id INTEGER;
    wednesday_id INTEGER;
    thursday_id INTEGER;
    friday_id INTEGER;
    
    -- Classroom IDs
    room_101 INTEGER;
    room_103 INTEGER;
    room_104 INTEGER;
    room_105 INTEGER;
    
    -- Class group IDs
    pw_a_2024 INTEGER;
    bd_a_2024 INTEGER;
    wd_a_2024 INTEGER;
    sd_a_2024 INTEGER;
    ka_a_2022 INTEGER;
    ep_a_2022 INTEGER;
    
    -- Schedule IDs for lecturer assignment
    schedule_id INTEGER;
BEGIN
    -- Get IDs
    SELECT id INTO academic_year_id FROM academic_years WHERE year_name = '2025-2026';
    
    SELECT id INTO monday_id FROM days WHERE day_name = 'Monday';
    SELECT id INTO tuesday_id FROM days WHERE day_name = 'Tuesday';
    SELECT id INTO wednesday_id FROM days WHERE day_name = 'Wednesday';
    SELECT id INTO thursday_id FROM days WHERE day_name = 'Thursday';
    SELECT id INTO friday_id FROM days WHERE day_name = 'Friday';
    
    SELECT id INTO room_101 FROM classrooms WHERE room_number = '101';
    SELECT id INTO room_103 FROM classrooms WHERE room_number = '103';
    SELECT id INTO room_104 FROM classrooms WHERE room_number = '104';
    SELECT id INTO room_105 FROM classrooms WHERE room_number = '105';
    
    -- Get class group IDs
    SELECT g.id INTO pw_a_2024 FROM class_groups g JOIN courses c ON g.course_id = c.id WHERE c.course_code = 'ILK2106' AND g.group_code = 'A';
    SELECT g.id INTO bd_a_2024 FROM class_groups g JOIN courses c ON g.course_id = c.id WHERE c.course_code = 'ILK2104' AND g.group_code = 'A';
    SELECT g.id INTO wd_a_2024 FROM class_groups g JOIN courses c ON g.course_id = c.id WHERE c.course_code = 'ILK2108' AND g.group_code = 'A';
    SELECT g.id INTO sd_a_2024 FROM class_groups g JOIN courses c ON g.course_id = c.id WHERE c.course_code = 'ILK2109' AND g.group_code = 'A';
    SELECT g.id INTO ka_a_2022 FROM class_groups g JOIN courses c ON g.course_id = c.id WHERE c.course_code = 'ILK3101' AND g.group_code = 'A';
    SELECT g.id INTO ep_a_2022 FROM class_groups g JOIN courses c ON g.course_id = c.id WHERE c.course_code = 'ILK3102' AND g.group_code = 'A';
    
    -- Insert Tuesday Schedule: Kecerdasan Buatan (13:50-16:20)
    INSERT INTO class_schedule (day_id, classroom_id, class_group_id, start_time, end_time, academic_year_id, week_sequence, meeting_number)
    VALUES (tuesday_id, room_104, ka_a_2022, '13:50', '16:20', academic_year_id, 1, 1)
    RETURNING id INTO schedule_id;
    
    INSERT INTO course_lecturers (schedule_id, lecturer_id, role) VALUES
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'AML'), 'Primary'),
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'PIN'), 'Assistant');
    
    -- Insert Wednesday Schedule: Pemrograman Website (08:00-10:30)
    INSERT INTO class_schedule (day_id, classroom_id, class_group_id, start_time, end_time, academic_year_id, week_sequence, meeting_number)
    VALUES (wednesday_id, room_103, pw_a_2024, '08:00', '10:30', academic_year_id, 1, 1)
    RETURNING id INTO schedule_id;
    
    INSERT INTO course_lecturers (schedule_id, lecturer_id, role) VALUES
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'DSG'), 'Primary'),
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'YEN'), 'Assistant');
    
    -- Insert Wednesday Schedule: Basis Data (14:40-17:10)
    INSERT INTO class_schedule (day_id, classroom_id, class_group_id, start_time, end_time, academic_year_id, week_sequence, meeting_number)
    VALUES (wednesday_id, room_103, bd_a_2024, '14:40', '17:10', academic_year_id, 1, 1)
    RETURNING id INTO schedule_id;
    
    INSERT INTO course_lecturers (schedule_id, lecturer_id, role) VALUES
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'INS'), 'Primary'),
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'DSG'), 'Assistant');
    
    -- Insert Thursday Schedule: Etika Profesi (08:00-09:40)
    INSERT INTO class_schedule (day_id, classroom_id, class_group_id, start_time, end_time, academic_year_id, week_sequence, meeting_number)
    VALUES (thursday_id, room_104, ep_a_2022, '08:00', '09:40', academic_year_id, 1, 1)
    RETURNING id INTO schedule_id;
    
    INSERT INTO course_lecturers (schedule_id, lecturer_id, role) VALUES
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'ADC'), 'Primary'),
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'EMZ'), 'Assistant');
    
    -- Insert Thursday Schedule: Wirausaha Digital (10:00-12:00)
    INSERT INTO class_schedule (day_id, classroom_id, class_group_id, start_time, end_time, academic_year_id, week_sequence, meeting_number)
    VALUES (thursday_id, room_104, wd_a_2024, '10:00', '12:00', academic_year_id, 1, 1)
    RETURNING id INTO schedule_id;
    
    INSERT INTO course_lecturers (schedule_id, lecturer_id, role) VALUES
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'HFM'), 'Primary'),
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'FZN'), 'Assistant');
    
    -- Insert Friday Schedule: Struktur Data (13:50-16:20)
    INSERT INTO class_schedule (day_id, classroom_id, class_group_id, start_time, end_time, academic_year_id, week_sequence, meeting_number)
    VALUES (friday_id, room_101, sd_a_2024, '13:50', '16:20', academic_year_id, 1, 1)
    RETURNING id INTO schedule_id;
    
    INSERT INTO course_lecturers (schedule_id, lecturer_id, role) VALUES
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'INS'), 'Primary'),
    (schedule_id, (SELECT id FROM lecturers WHERE lecturer_code = 'AMN'), 'Assistant');
    
END $$;