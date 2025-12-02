-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_subject ON announcements(subject);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
