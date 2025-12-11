-- Fix status constraint to allow 'changed' status
ALTER TABLE schedule_events DROP CONSTRAINT IF EXISTS schedule_events_status_check;
ALTER TABLE schedule_events ADD CONSTRAINT schedule_events_status_check 
CHECK (status IN ('scheduled', 'cancelled', 'update', 'replaced', 'changed', 'default'));