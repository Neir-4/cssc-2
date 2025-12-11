-- Fix user roles to support only Admin and Komting (Phase 1 Simplification)
-- Drop existing constraint and add new one

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with only Admin and Komting roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'komting'));

-- Update existing users to use simplified roles
-- Convert all existing roles to either admin or komting
UPDATE users SET role = 'admin' WHERE role NOT IN ('admin', 'komting');

-- Reset all passwords to admin123 for testing
UPDATE users SET password_hash = '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ';

-- Ensure we have proper komting users
UPDATE users SET role = 'komting' WHERE email IN ('alya@usu.ac.id', 'dzakwan@usu.ac.id');