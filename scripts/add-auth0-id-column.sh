#!/bin/bash

# Script to add auth0_id column to students table
# This fixes the schema validation error

echo "Adding auth0_id column to students table..."

docker exec -i distrischool-postgres psql -U distrischool -d distrischool_students <<EOF
-- Add auth0_id column to students table if it doesn't exist
DO \$\$
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
END \$\$;
EOF

echo "Done! Please restart the student-management-service-dev container."





