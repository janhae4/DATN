CREATE EXTENSION IF NOT EXISTS dblink;

DO $$ BEGIN IF NOT EXISTS (
    SELECT
    FROM pg_database
    WHERE
        datname = 'team'
) THEN PERFORM dblink_exec (
    'dbname=postgres',
    'CREATE DATABASE team'
);

END IF;

IF NOT EXISTS (
    SELECT
    FROM pg_database
    WHERE
        datname = 'task'
) THEN PERFORM dblink_exec (
    'dbname=postgres',
    'CREATE DATABASE task'
);

END IF;

IF NOT EXISTS (
    SELECT
    FROM pg_database
    WHERE
        datname = 'user'
) THEN PERFORM dblink_exec (
    'dbname=postgres',
    'CREATE DATABASE "user"'
);

END IF;

IF NOT EXISTS (
    SELECT
    FROM pg_database
    WHERE
        datname = 'notification'
) THEN PERFORM dblink_exec (
    'dbname=postgres',
    'CREATE DATABASE notification'
);

END IF;

END $$;