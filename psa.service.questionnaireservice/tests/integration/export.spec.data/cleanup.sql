BEGIN;

DELETE FROM questionnaires WHERE study_id = 'Teststudie - Export';

DELETE FROM questions WHERE id = 2618;
DELETE FROM questions WHERE id = 2620;
DELETE FROM questions WHERE id = 2621;
DELETE FROM questions WHERE id = 2622;
DELETE FROM questions WHERE id = 2623;
DELETE FROM questions WHERE id = 2624;
DELETE FROM questions WHERE id = 2625;
DELETE FROM questions WHERE id = 2626;

DELETE FROM answer_options WHERE id = 5967;
DELETE FROM answer_options WHERE id = 5968;
DELETE FROM answer_options WHERE id = 5969;
DELETE FROM answer_options WHERE id = 5970;
DELETE FROM answer_options WHERE id = 5971;
DELETE FROM answer_options WHERE id = 5972;
DELETE FROM answer_options WHERE id = 5973;
DELETE FROM answer_options WHERE id = 5974;
DELETE FROM answer_options WHERE id = 5975;
DELETE FROM answer_options WHERE id = 5976;
DELETE FROM answer_options WHERE id = 5987;
DELETE FROM answer_options WHERE id = 5988;
DELETE FROM answer_options WHERE id = 5989;
DELETE FROM answer_options WHERE id = 5990;
DELETE FROM answer_options WHERE id = 5991;
DELETE FROM answer_options WHERE id = 5992;
DELETE FROM answer_options WHERE id = 5993;
DELETE FROM answer_options WHERE id = 5994;
DELETE FROM answer_options WHERE id = 5995;
DELETE FROM answer_options WHERE id = 5996;
DELETE FROM answer_options WHERE id = 5997;
DELETE FROM answer_options WHERE id = 5998;
DELETE FROM answer_options WHERE id = 5999;
DELETE FROM answer_options WHERE id = 6000;
DELETE FROM answer_options WHERE id = 6001;
DELETE FROM answer_options WHERE id = 6002;

DELETE FROM questionnaire_instances WHERE study_id = 'Teststudie - Export';

DELETE FROM answers WHERE questionnaire_instance_id = 17712518;
DELETE FROM answers WHERE questionnaire_instance_id = 17712524;
DELETE FROM answers WHERE questionnaire_instance_id = 17712517;
DELETE FROM answers WHERE questionnaire_instance_id = 17712522;
DELETE FROM answers WHERE questionnaire_instance_id = 17712530;
DELETE FROM answers WHERE questionnaire_instance_id = 17712519;
DELETE FROM answers WHERE questionnaire_instance_id = 17712531;
DELETE FROM answers WHERE questionnaire_instance_id = 17712534;
DELETE FROM answers WHERE questionnaire_instance_id = 17712525;
DELETE FROM answers WHERE questionnaire_instance_id = 17712513;
DELETE FROM answers WHERE questionnaire_instance_id = 17712514;
DELETE FROM answers WHERE questionnaire_instance_id = 17712515;
DELETE FROM answers WHERE questionnaire_instance_id = 17712541;
DELETE FROM answers WHERE questionnaire_instance_id = 17712537;
DELETE FROM answers WHERE questionnaire_instance_id = 17712528;

DELETE FROM study_users WHERE user_id = 'Rtest-0000000002';
DELETE FROM study_users WHERE user_id = 'Rtest-0000000003';
DELETE FROM study_users WHERE user_id = 'Rtest-0000000004';
DELETE FROM study_users WHERE user_id = 'Rtest-0000000005';
DELETE FROM study_users WHERE user_id = 'Rtest-0000000006';
DELETE FROM study_users WHERE user_id = 'Rtest-0000000007';

DELETE FROM users WHERE username = 'Rtest-0000000002';
DELETE FROM users WHERE username = 'Rtest-0000000003';
DELETE FROM users WHERE username = 'Rtest-0000000004';
DELETE FROM users WHERE username = 'Rtest-0000000005';
DELETE FROM users WHERE username = 'Rtest-0000000006';
DELETE FROM users WHERE username = 'Rtest-0000000007';

DELETE FROM study_users WHERE user_id = 'QExportTestForscher';
DELETE FROM users WHERE username = 'QExportTestForscher';

COMMIT;
