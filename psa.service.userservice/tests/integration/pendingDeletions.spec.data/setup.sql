INSERT INTO users (username, password, role)
VALUES ('ApiTestProband1', '', 'Proband'),
       ('ApiTestProband2', '', 'Proband'),
       ('ApiTestProband3', '', 'Proband'),
       ('ApiTestProband4', '', 'Proband'),
       ('forscher1@apitest.de', '', 'Forscher'),
       ('forscher2@apitest.de', '', 'Forscher'),
       ('ut1@apitest.de', '', 'Untersuchungsteam'),
       ('ut2@apitest.de', '', 'Untersuchungsteam'),
       ('pm1@apitest.de', '', 'ProbandenManager'),
       ('pm2@apitest.de', '', 'ProbandenManager'),
       ('pmNoEmail', '', 'ProbandenManager'),
       ('pm4@apitest.de', '', 'ProbandenManager'),
       ('sa1@apitest.de', '', 'SysAdmin'),
       ('sa2@apitest.de', '', 'SysAdmin'),
       ('sa3@apitest.de', '', 'SysAdmin');
INSERT INTO studies
VALUES ('ApiTestStudie1', 'ApiTestStudie1 Beschreibung'),
       ('ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'),
       ('ApiTestStudie3', 'ApiTestStudie3 Beschreibung]');
INSERT INTO study_users
VALUES ('ApiTestStudie1', 'ApiTestProband1', 'read'),
       ('ApiTestStudie2', 'ApiTestProband2', 'read'),
       ('ApiTestStudie3', 'ApiTestProband3', 'read'),
       ('ApiTestStudie1', 'ApiTestProband4', 'read'),
       ('ApiTestStudie1', 'forscher1@apitest.de', 'write'),
       ('ApiTestStudie1', 'forscher2@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut1@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm1@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm2@apitest.de', 'write'),
       ('ApiTestStudie2', 'pm4@apitest.de', 'write'),
       ('ApiTestStudie1', 'pmNoEmail', 'write');
INSERT INTO pending_deletions
VALUES (1234560, 'pm1@apitest.de', 'pm2@apitest.de', 'proband', 'ApiTestProband2'),
       (1234561, 'pmNoEmail', 'pm2@apitest.de', 'proband', 'ApiTestProband1'),
       (1234562, 'pm1@apitest.de', 'pm2@apitest.de', 'sample', 'APISAMPLE_11111'),
       (1234565, 'sa1@apitest.de', 'sa2@apitest.de', 'study', 'ApiTestStudie1');

INSERT INTO planned_probands
VALUES ('ApiPlannedTestName1', 'somerandompw', null),
       ('ApiPlannedTestName2', 'somerandompw', null);
INSERT INTO study_planned_probands
VALUES ('ApiTestStudie1', 'ApiPlannedTestName1'),
       ('ApiTestStudie1', 'ApiPlannedTestName2');
INSERT INTO lab_results (id, user_id, order_id, status, remark, new_samples_sent, performing_doctor)
VALUES ('APISAMPLE_11111', 'ApiTestProband2', 1, 'active', 'my remark comment', false, 'dr who'),
       ('APISAMPLE_11112', 'ApiTestProband3', 1, 'active', 'my remark comment', false, 'dr who'),
       ('APISAMPLE_11113', 'ApiTestProband1', 1, 'active', 'my remark comment', false, 'dr who');
INSERT INTO lab_observations
VALUES (123456, 'APISAMPLE_11111', 0),
       (123457, 'APISAMPLE_11111', 1);
INSERT INTO blood_samples
VALUES (123456, 'ApiTestProband1', 'APIBloodSample1');
INSERT INTO questionnaires
VALUES (123456, 'ApiTestStudie1', 'ApiQuestionnaireName', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1', 'not_body1');
INSERT INTO questions
VALUES (123456, 123456, 'question_text', 0);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (123456, 123456, 'subquestion_text1', 1, null, null, 0),
       (123457, 123456, 'subquestion_text2', 1, null, null, 1);
INSERT INTO questionnaire_instances
VALUES (123456, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName', 'ApiTestProband1', '2021-01-18T14:14:03.155+01:00',
        null, null, 0, 'active'),
       (123457, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName', 'ApiTestProband1', '2021-01-18T14:14:03.156+01:00',
        null, null, 1, 'active');
INSERT INTO questionnaire_instances_queued
VALUES ('ApiTestProband1', 123456, '2021-01-18T14:14:03.156+01:00'),
       ('ApiTestProband1', 123457, '2021-01-18T14:14:03.156+01:00');
INSERT INTO answers
VALUES (123456, 123456, 123456, 1, 'some answer value'),
       (123457, 123456, 123456, 1, 11111);
INSERT INTO user_files
VALUES (123456, 'ApiTestProband1', 123456, 123456, 'somerandomimagebase64encodedstuff');
INSERT INTO notification_schedules
VALUES (123456, 'ApiTestProband1', '2021-01-18T14:14:03.156+01:00', 'qInstance', 123456, 'title', 'body'),
       (123457, 'ApiTestProband1', '2021-01-18T14:14:03.156+01:00', 'sample', 'APISAMPLE_11111', 'title', 'body');
