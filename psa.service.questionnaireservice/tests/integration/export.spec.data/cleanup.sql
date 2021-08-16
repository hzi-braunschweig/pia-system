BEGIN;

DELETE FROM questionnaires;
DELETE FROM questions;
DELETE FROM answer_options;
DELETE FROM questionnaire_instances;
DELETE FROM answers;
DELETE FROM study_users;
DELETE FROM users;
DELETE FROM studies;

COMMIT;
