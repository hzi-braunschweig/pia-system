BEGIN;

DELETE FROM answers;
DELETE FROM answer_options;
DELETE FROM questionnaire_instances;
DELETE FROM questions;
DELETE FROM questionnaires;
DELETE FROM study_users;
DELETE FROM probands;
DELETE FROM accounts;
DELETE FROM studies;

COMMIT;
