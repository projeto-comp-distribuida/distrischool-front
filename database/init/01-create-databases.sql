-- Create separate databases for each microservice
-- This script runs when PostgreSQL container starts for the first time

-- Create database for Student Management Service
CREATE DATABASE distrischool_students;

-- Create database for teacher Service  
CREATE DATABASE distrischool_teacher;

-- Grant permissions to the distrischool user for all databases
GRANT ALL PRIVILEGES ON DATABASE distrischool_auth TO distrischool;
GRANT ALL PRIVILEGES ON DATABASE distrischool_students TO distrischool;
GRANT ALL PRIVILEGES ON DATABASE distrischool_teacher TO distrischool;

-- Connect to each database and grant schema permissions
\c distrischool_auth;
GRANT ALL ON SCHEMA public TO distrischool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO distrischool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO distrischool;

\c distrischool_students;
GRANT ALL ON SCHEMA public TO distrischool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO distrischool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO distrischool;

\c distrischool_teacher;
GRANT ALL ON SCHEMA public TO distrischool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO distrischool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO distrischool;
