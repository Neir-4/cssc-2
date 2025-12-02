-- Migration to remove unwanted rooms
DELETE FROM rooms WHERE name IN ('GL 1', 'Lab 2', 'Lab 3');

-- Update any references to these rooms in other tables
-- For example, if there's a default_room_id in courses table:
-- UPDATE courses SET default_room_id = NULL WHERE default_room_id IN (SELECT id FROM rooms WHERE name IN ('GL 1', 'Lab 2', 'Lab 3'));

-- Verify the remaining rooms
SELECT id, name, building FROM rooms ORDER BY name;
