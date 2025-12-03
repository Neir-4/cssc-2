-- Add credits column to courses table
ALTER TABLE courses ADD COLUMN credits INTEGER DEFAULT 2;

-- Update courses with their respective credits
UPDATE courses SET credits = 3 WHERE name = 'Pemrograman Website';
UPDATE courses SET credits = 3 WHERE name = 'Kecerdasan Buatan'; 
UPDATE courses SET credits = 3 WHERE name = 'Basis Data';
UPDATE courses SET credits = 2 WHERE name = 'Etika Profesi';
UPDATE courses SET credits = 2 WHERE name = 'Wirausaha Digital';
UPDATE courses SET credits = 3 WHERE name = 'Struktur Data';

-- Add index for credits column
CREATE INDEX IF NOT EXISTS idx_courses_credits ON courses(credits);
