-- Add auth0_id column to students table if it doesn't exist
-- This script fixes the schema validation error for the student-management-service

-- Connect to the students database
\c distrischool_students;

-- Add auth0_id column to students table (nullable, as it may not be set for all students)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'auth0_id'
    ) THEN
        ALTER TABLE students ADD COLUMN auth0_id VARCHAR(255);
        RAISE NOTICE 'Added auth0_id column to students table';
    ELSE
        RAISE NOTICE 'auth0_id column already exists in students table';
    END IF;
END $$;


