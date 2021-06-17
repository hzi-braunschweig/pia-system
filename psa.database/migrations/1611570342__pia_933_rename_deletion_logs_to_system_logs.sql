ALTER TABLE IF EXISTS deletion_logs SET SCHEMA public;
ALTER TABLE IF EXISTS deletion_logs ALTER COLUMN id SET DEFAULT nextval('deletion_logs_id_seq');
DROP FUNCTION IF EXISTS deletion_logs_id_default;
ALTER TABLE IF EXISTS deletion_logs RENAME COLUMN deletion_time TO timestamp;
ALTER TABLE IF EXISTS deletion_logs RENAME TO system_logs;
ALTER SEQUENCE IF EXISTS deletion_logs_id_seq RENAME TO system_logs_id_seq;
