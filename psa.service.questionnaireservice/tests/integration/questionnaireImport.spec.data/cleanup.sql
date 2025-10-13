DELETE FROM conditions WHERE condition_target_questionnaire IN (SELECT id FROM questionnaires WHERE study_id='QTestStudy');
DELETE FROM questionnaires WHERE study_id='QTestStudy';
DELETE FROM studies WHERE name='QTestStudy';
DELETE FROM conditions WHERE condition_target_questionnaire IN (SELECT id FROM questionnaires WHERE study_id='QTestStudy2');
DELETE FROM questionnaires WHERE study_id='QTestStudy2';
DELETE FROM studies WHERE name='QTestStudy2';