-- Insert master data
INSERT INTO academic_years (year_name, semester, start_date, end_date) VALUES
('2025-2026', 'Ganjil', '2025-09-01', '2026-01-31');

INSERT INTO days (day_name, day_short, day_order) VALUES
('Monday', 'Mon', 1),
('Tuesday', 'Tue', 2),
('Wednesday', 'Wed', 3),
('Thursday', 'Thu', 4),
('Friday', 'Fri', 5),
('Saturday', 'Sat', 6),
('Sunday', 'Sun', 7);

INSERT INTO buildings (building_name, building_code, location) VALUES
('Gedung D', 'GD', 'Kampus USU');

INSERT INTO classrooms (room_number, building_id, capacity) VALUES
('101', 1, 40),
('102', 1, 40),
('103', 1, 40),
('104', 1, 40),
('105', 1, 40),
('106', 1, 40);

INSERT INTO study_programs (program_code, program_name, faculty) VALUES
('ILKOM', 'Ilmu Komputer', 'Matematika dan Ilmu Pengetahuan Alam');

INSERT INTO lecturers (lecturer_code, full_name, title) VALUES
('DSG', 'Dr. Dewi Sartika Br Ginting, S.Kom, M.Kom', 'Doktor'),
('YEN', 'Nurrahmadayeni M.Kom', 'M.Kom'),
('AML', 'Dr. Amalia, ST, MT', 'Doktor'),
('PIN', 'Dr. Pauzi Ibrahim Nainggolan, S.Komp., M.Sc', 'Doktor'),
('INS', 'Insidini Fawwaz M.Kom', 'M.Kom'),
('ADC', 'Dr. Eng. Ade Candra, ST, M.Kom', 'Doktor'),
('EMZ', 'Dr.Ir. Elviawaty Muisa Zamzami, ST, MT', 'Doktor'),
('HFM', 'Dr. T. Henny Febriana Harumy S.Kom, M.Kom.', 'Doktor'),
('FZN', 'Dr. Fauzan Nurahmadi, S.Kom, M.Cs', 'Doktor'),
('AMN', 'Anandhini Medianty Nababan S. Kom., M. T', 'M.T');

INSERT INTO courses (course_code, course_name, credits, semester, study_program_id, course_type) VALUES
('ILK2106', 'Pemrograman Website', 3, 3, 1, 'Wajib'),
('ILK2104', 'Basis Data', 3, 3, 1, 'Wajib'),
('ILK2108', 'Wirausaha Digital', 2, 3, 1, 'Pilihan'),
('ILK2109', 'Struktur Data', 3, 3, 1, 'Wajib'),
('ILK3101', 'Kecerdasan Buatan', 3, 5, 1, 'Wajib'),
('ILK3102', 'Etika Profesi', 2, 5, 1, 'Wajib');

INSERT INTO class_groups (group_code, course_id, class_year, capacity) VALUES
('A', 1, 2024, 40), -- Pemrograman Website A 2024
('A', 2, 2024, 40), -- Basis Data A 2024
('A', 3, 2024, 30), -- Wirausaha Digital A 2024
('A', 4, 2024, 40), -- Struktur Data A 2024
('A', 5, 2022, 40), -- Kecerdasan Buatan A 2022
('A', 6, 2022, 30); -- Etika Profesi A 2022

-- Insert users (keep existing authentication system)
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Yehezkiel', 'yehezkiel@usu.ac.id', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'admin', '+62812345678'),
('Muhammad Syukron', 'syukron@usu.ac.id', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'admin', '+62812345679'),
('Alya Debora', 'alya@usu.ac.id', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'komting', '+62812345680'),
('Taufik Akbar', 'taufik@usu.ac.id', '$2a$10$rOzJqQjQjQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'admin', '+62812345681'),
('Anandhini', 'anandhini@usu.ac.id', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'komting', '+62812345682');