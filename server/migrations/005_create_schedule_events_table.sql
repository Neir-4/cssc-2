-- Create Schedule Events Table (Real-time schedule changes)
CREATE TABLE IF NOT EXISTS schedule_events (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'default' CHECK (status IN ('default', 'update', 'cancelled')),
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Komting who made the change
    change_reason TEXT,
    previous_event_id INTEGER REFERENCES schedule_events(id) ON DELETE SET NULL, -- Link to previous event if this is an update
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_course ON schedule_events(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_room ON schedule_events(room_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(event_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_status ON schedule_events(status);
CREATE INDEX IF NOT EXISTS idx_schedule_events_datetime ON schedule_events(event_date, start_time);

-- Create unique constraint to prevent duplicate events
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_events_unique 
ON schedule_events(course_id, event_date, start_time) 
WHERE status != 'cancelled';

-- Create trigger for updated_at
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE
    ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
