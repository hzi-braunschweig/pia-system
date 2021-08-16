BEGIN;

DELETE FROM questionnaires;
DELETE FROM questions;
DELETE FROM answer_options;
DELETE FROM questionnaire_instances;
DELETE FROM answers;
DELETE FROM study_users;
DELETE FROM users;
DELETE FROM studies;
DELETE FROM blood_samples;
DELETE FROM lab_results;
DELETE FROM lab_observations;

COMMIT;
