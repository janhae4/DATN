CREATE EXTENSION IF NOT EXISTS dblink;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'team') THEN 
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE team');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'task') THEN 
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE task');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'user') THEN 
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE "user"');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'notification') THEN 
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE notification');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'call') THEN 
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE call');
    END IF;
END $$;

