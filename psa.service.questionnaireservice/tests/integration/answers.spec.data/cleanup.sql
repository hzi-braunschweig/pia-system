DELETE FROM study_users WHERE user_id IN('qtest-proband1','qtest-forscher1', 'qtest-proband2', 'qtest-forscher2', 'qtest-proband3', 'qtest-proband4', 'qtest-proband5', 'qtest-probandenmanager', 'qtest-untersuchungsteam');
DELETE FROM user_files WHERE user_id='qtest-proband1' OR user_id='qtest-proband2';
DELETE FROM answers WHERE questionnaire_instance_id=99996 OR questionnaire_instance_id=99997 OR questionnaire_instance_id=99998 OR questionnaire_instance_id=99999 OR questionnaire_instance_id=888888 OR questionnaire_instance_id=888889 OR questionnaire_instance_id=888890 OR questionnaire_instance_id=888891 OR questionnaire_instance_id=888892 OR questionnaire_instance_id=888893;
DELETE FROM questionnaire_instances_queued WHERE user_id='qtest-proband1' OR user_id='qtest-proband2';
DELETE FROM questionnaire_instances WHERE user_id='qtest-proband1' OR user_id='qtest-proband2';

DELETE FROM questionnaire_instances WHERE questionnaire_id=99999 OR questionnaire_id=888888 OR questionnaire_id=888889 OR questionnaire_id=777777 OR questionnaire_id=777778;
DELETE FROM conditions WHERE condition_target_questionnaire=888888 OR condition_target_questionnaire=888889 OR condition_target_questionnaire=777777;
DELETE FROM notification_schedules WHERE user_id IN ('qtest-proband1', 'qtest-proband2', 'qtest-forscher1', 'qtest-forscher2', 'qtest-untersuchungsteam', 'qtest-proband3', 'qtest-proband4', 'qtest-proband5', 'qtest-probandenmanager', 'qtest-sysadmin', 'qtest-exportproband2');
DELETE FROM probands WHERE pseudonym LIKE 'qtest%';
DELETE FROM answer_options WHERE question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=ANY(SELECT id FROM questionnaires WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudi4'));
DELETE FROM lab_results WHERE id='ANSWERTEST-1234570';
DELETE FROM questions WHERE questionnaire_id=ANY(SELECT id FROM questionnaires WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudi4');
DELETE FROM questionnaires WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudi4';
DELETE FROM studies WHERE name='ApiTestStudie' OR name='ApiTestStudi2' OR name='ApiTestStudi3' OR name='ApiTestStudi4' OR name='NewApiTestStudie' OR name='NewApiTestStudie2' OR name='NewApiTestStudie3' OR name='NewApiTestStudieChanged';
DELETE FROM studies WHERE name='ApiTestMultiProbands' OR name = 'ApiTestMultiProfs';

DELETE FROM answers WHERE questionnaire_instance_id>=666666 AND questionnaire_instance_id<=666675;
DELETE FROM questionnaire_instances WHERE questionnaire_id=666666 OR questionnaire_id=666667;
DELETE FROM answer_options WHERE question_id>=666666 AND question_id<=666669;
DELETE FROM questions WHERE questionnaire_id=666666 OR questionnaire_id=666667;
DELETE FROM questionnaires WHERE study_id='ExportTestStudie';
DELETE FROM studies WHERE name='ExportTestStudie';

DELETE FROM study_welcome_text WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudie2';
