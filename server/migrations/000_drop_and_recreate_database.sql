-- Drop existing tables and recreate with new schema
DROP TABLE IF EXISTS course_materials CASCADE;
DROP TABLE IF EXISTS schedule_changes CASCADE;
DROP TABLE IF EXISTS course_lecturers CASCADE;
DROP TABLE IF EXISTS class_schedule CASCADE;
DROP TABLE IF EXISTS class_groups CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS study_programs CASCADE;
DROP TABLE IF EXISTS lecturers CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS days CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;

-- Drop old tables if they exist
DROP TABLE IF EXISTS course_subscriptions CASCADE;
DROP TABLE IF EXISTS schedule_events CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS security_logs CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- Create new schema
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) NOT NULL,
    semester VARCHAR(10) CHECK (semester IN ('Ganjil', 'Genap')),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE days (
    id SERIAL PRIMARY KEY,
    day_name VARCHAR(20) NOT NULL UNIQUE,
    day_short VARCHAR(3),
    day_order INTEGER
);

CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    building_name VARCHAR(50) NOT NULL,
    building_code VARCHAR(10),
    location TEXT
);

CREATE TABLE classrooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL,
    building_id INTEGER REFERENCES buildings(id),
    capacity INTEGER,
    facilities TEXT,
    UNIQUE(room_number, building_id)
);

CREATE TABLE lecturers (
    id SERIAL PRIMARY KEY,
    lecturer_code VARCHAR(20) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    title VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE study_programs (
    id SERIAL PRIMARY KEY,
    program_code VARCHAR(20) UNIQUE NOT NULL,
    program_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100)
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    credits INTEGER DEFAULT 3,
    semester INTEGER CHECK (semester BETWEEN 1 AND 8),
    study_program_id INTEGER REFERENCES study_programs(id),
    course_type VARCHAR(20) CHECK (course_type IN ('Wajib', 'Pilihan', 'Praktikum')),
    UNIQUE(course_code, semester)
);

CREATE TABLE class_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(20) NOT NULL,
    course_id INTEGER REFERENCES courses(id),
    class_year INTEGER,
    capacity INTEGER,
    UNIQUE(group_code, course_id, class_year)
);

CREATE TABLE class_schedule (
    id SERIAL PRIMARY KEY,
    day_id INTEGER REFERENCES days(id),
    classroom_id INTEGER REFERENCES classrooms(id),
    class_group_id INTEGER REFERENCES class_groups(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    academic_year_id INTEGER REFERENCES academic_years(id),
    week_sequence INTEGER DEFAULT 1,
    meeting_number INTEGER,
    is_rescheduled BOOLEAN DEFAULT FALSE,
    rescheduled_from_id INTEGER REFERENCES class_schedule(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course_lecturers (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES class_schedule(id),
    lecturer_id INTEGER REFERENCES lecturers(id),
    role VARCHAR(20) CHECK (role IN ('Primary', 'Assistant', 'Coordinator')),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(schedule_id, lecturer_id)
);

CREATE TABLE schedule_changes (
    id SERIAL PRIMARY KEY,
    original_schedule_id INTEGER REFERENCES class_schedule(id),
    new_day_id INTEGER REFERENCES days(id),
    new_classroom_id INTEGER REFERENCES classrooms(id),
    new_start_time TIME,
    new_end_time TIME,
    new_week_sequence INTEGER,
    reason TEXT,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved BOOLEAN DEFAULT FALSE,
    approved_by INTEGER,
    approved_at TIMESTAMP
);

CREATE TABLE course_materials (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES class_schedule(id),
    material_name VARCHAR(200) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Keep users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'komting')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Keep announcements table
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_role VARCHAR(50),
    date DATE NOT NULL,
    time TIME,
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_class_schedule_day_time ON class_schedule(day_id, start_time, week_sequence);
CREATE INDEX idx_class_schedule_classroom ON class_schedule(classroom_id, day_id, week_sequence);
CREATE INDEX idx_class_schedule_week ON class_schedule(week_sequence, meeting_number);
CREATE INDEX idx_course_lecturers_schedule ON course_lecturers(schedule_id);
CREATE INDEX idx_schedule_changes_date ON schedule_changes(changed_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);