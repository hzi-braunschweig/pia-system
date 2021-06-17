DELETE FROM study_users WHERE user_id IN('QTestProband1','QTestForscher1', 'QTestProband2', 'QTestForscher2', 'QTestProband3', 'QTestProband4', 'QTestProband5', 'QTestProbandenManager', 'QTestUntersuchungsteam');
DELETE FROM user_files WHERE user_id='QTestProband1' OR user_id='QTestProband2';
DELETE FROM answers WHERE questionnaire_instance_id=99996 OR questionnaire_instance_id=99997 OR questionnaire_instance_id=99998 OR questionnaire_instance_id=99999 OR questionnaire_instance_id=888888 OR questionnaire_instance_id=888889 OR questionnaire_instance_id=888890 OR questionnaire_instance_id=888891 OR questionnaire_instance_id=888892 OR questionnaire_instance_id=888893;
DELETE FROM questionnaire_instances_queued WHERE user_id='QTestProband1' OR user_id='QTestProband2';
DELETE FROM questionnaire_instances WHERE user_id='QTestProband1' OR user_id='QTestProband2';

DELETE FROM questionnaire_instances WHERE questionnaire_id=99999 OR questionnaire_id=888888 OR questionnaire_id=888889 OR questionnaire_id=777777 OR questionnaire_id=777778;
DELETE FROM conditions WHERE condition_target_questionnaire=888888 OR condition_target_questionnaire=888889 OR condition_target_questionnaire=777777;
DELETE FROM notification_schedules WHERE user_id IN ('QTestProband1', 'QTestProband2', 'QTestForscher1', 'QTestForscher2', 'QTestUntersuchungsteam', 'QTestProband3', 'QTestProband4', 'QTestProband5', 'QTestProbandenManager', 'QTestSysAdmin', 'QExportTestProband2');
DELETE FROM users WHERE username IN ('QTestProband1', 'QTestProband2', 'QTestForscher1', 'QTestForscher2', 'QTestUntersuchungsteam', 'QTestUntersuchungsteam2', 'QTestProband3', 'QTestProband4', 'QTestProband5', 'QTestProbandenManager', 'QTestSysAdmin');
DELETE FROM answer_options WHERE question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=ANY(SELECT id FROM questionnaires WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudi4'));
DELETE FROM lab_results WHERE id='ANSWERTEST-1234570';
DELETE FROM questions WHERE questionnaire_id=ANY(SELECT id FROM questionnaires WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudi4');
DELETE FROM questionnaires WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudi4';
DELETE FROM studies WHERE name='ApiTestStudie' OR name='ApiTestStudi2' OR name='ApiTestStudi3' OR name='ApiTestStudi4' OR name='NewApiTestStudie' OR name='NewApiTestStudie2' OR name='NewApiTestStudie3' OR name='NewApiTestStudieChanged';
DELETE FROM studies WHERE name='ApiTestMultiProbands' OR name = 'ApiTestMultiProfs';

DELETE FROM study_users WHERE study_id='ExportTestStudie';
DELETE FROM answers WHERE questionnaire_instance_id>=666666 AND questionnaire_instance_id<=666675;
DELETE FROM questionnaire_instances WHERE questionnaire_id=666666 OR questionnaire_id=666667;
DELETE FROM users WHERE username='QExportTestProband1' OR username='QExportTestProband2' OR username='QExportTestForscher';
DELETE FROM answer_options WHERE question_id>=666666 AND question_id<=666669;
DELETE FROM questions WHERE questionnaire_id=666666 OR questionnaire_id=666667;
DELETE FROM questionnaires WHERE study_id='ExportTestStudie';
DELETE FROM studies WHERE name='ExportTestStudie';

DELETE FROM study_welcome_text WHERE study_id='ApiTestStudie' OR study_id='ApiTestStudie2';
