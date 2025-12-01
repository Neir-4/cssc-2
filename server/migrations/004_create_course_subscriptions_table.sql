-- Create Course Subscriptions Table (Many-to-Many between Users and Courses)
CREATE TABLE IF NOT EXISTS course_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_subscriptions_user ON course_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_subscriptions_course ON course_subscriptions(course_id);
