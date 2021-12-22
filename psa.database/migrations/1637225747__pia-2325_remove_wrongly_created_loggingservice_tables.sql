/**
 * These migrations are a clean up after issues with a
 * wrong default search_path. Because of the search_path
 * pointing to loggingservice schema, migrations were
 * executed on production within loggingservice instead
 * of public between March 2021 (v1.14.0) and July 2021
 * (v1.22.0).
 */

DROP TABLE IF EXISTS loggingservice.pending_study_changes;
DROP TABLE IF EXISTS loggingservice.users_to_contact;
DROP TABLE IF EXISTS loggingservice.one_time_auth_token;
DROP TABLE IF EXISTS loggingservice.study_welcome_text;
DROP TABLE IF EXISTS loggingservice.db_migrations;
DROP FUNCTION IF EXISTS loggingservice.check_username_exists;

ALTER EXTENSION "uuid-ossp" SET SCHEMA public;
