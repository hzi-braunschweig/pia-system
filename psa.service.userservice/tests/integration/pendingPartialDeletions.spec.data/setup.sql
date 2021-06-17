INSERT INTO studies (name)
 VALUES ('ApiTestMultiProband'),
        ('ApiTestMultiProf'),
        ('ApiTestStudie1'),
        ('ApiTestStudie2');

INSERT INTO users (username, password, role)
 VALUES ('ApiTestProband1','','Proband'),
        ('ApiTestProband2','','Proband'),
        ('forscher1@apitest.de','','Forscher'),
        ('forscher2@apitest.de','','Forscher'),
        ('forscher4@apitest.de','','Forscher'),
        ('forscherNoEmail','','Forscher'),
        ('pm1@apitest.de','','ProbandenManager'),
        ('sa1@apitest.de','','SysAdmin'),
        ('sa2@apitest.de','','SysAdmin'),
        ('ut1@apitest.de','','Untersuchungsteam');

INSERT INTO study_users (study_id, user_id, access_level)
 VALUES ('ApiTestMultiProf','forscher1@apitest.de','write'),
        ('ApiTestMultiProf','forscher2@apitest.de','write'),
        ('ApiTestMultiProf','forscher4@apitest.de','write'),
        ('ApiTestMultiProf','forscherNoEmail','write'),
        ('ApiTestMultiProf','pm1@apitest.de','write'),
        ('ApiTestMultiProf','ut1@apitest.de','write'),
        ('ApiTestStudie1','ApiTestProband1','read'),
        ('ApiTestStudie1','forscher1@apitest.de','write'),
        ('ApiTestStudie1','forscher2@apitest.de','write'),
        ('ApiTestStudie1','forscherNoEmail','write'),
        ('ApiTestStudie1','pm1@apitest.de','write'),
        ('ApiTestStudie1','ut1@apitest.de','write'),
        ('ApiTestStudie2','ApiTestProband2','read'),
        ('ApiTestStudie2','forscher4@apitest.de','write');

INSERT INTO lab_results (id, user_id)
 VALUES ('APISAMPLE_11111','ApiTestProband1'),
        ('APISAMPLE_11112','ApiTestProband1'),
        ('APISAMPLE_11113','ApiTestProband2');
INSERT INTO lab_observations (id, lab_result_id, name_id)
 VALUES (123456,'APISAMPLE_11111',0),
        (123457,'APISAMPLE_11111',1),
        (123458,'APISAMPLE_11112',0),
        (123459,'APISAMPLE_11112',1);

INSERT INTO questionnaires
 VALUES (123456,'ApiTestStudie1','ApiQuestionnaireName1',1,0,'once',0,0,3,'not_title','not_body1','not_body1'),
        (123457,'ApiTestStudie2','ApiQuestionnaireName2',1,0,'once',0,0,3,'not_title','not_body1','not_body1');
INSERT INTO questions
 VALUES (123456,123456,'question_text',0),
        (123457,123457,'question_text',0);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
 VALUES(123456,123456,'subquestion_text1',1,null,null,0),
        (123457,123456,'subquestion_text2',1,null,null,1),
        (123458,123457,'subquestion_text1',1,null,null,0),
        (123459,123457,'subquestion_text2',1,null,null,1);

INSERT INTO questionnaire_instances
 VALUES (123456,'ApiTestStudie1',123456,'ApiQuestionnaireName1','ApiTestProband1','2021-01-04T10:18:30.825+01:00',null,null,0,'active'),
        (123457,'ApiTestStudie1',123456,'ApiQuestionnaireName1','ApiTestProband1','2021-01-04T10:18:30.825+01:00',null,null,1,'active'),
        (123458,'ApiTestStudie1',123457,'ApiQuestionnaireName2','ApiTestProband2','2021-03-04T10:18:30.825+01:00',null,null,0,'active'),
        (123459,'ApiTestStudie1',123457,'ApiQuestionnaireName2','ApiTestProband2','2021-03-04T10:18:30.825+01:00',null,null,1,'active');
INSERT INTO answers
 VALUES (123456,123456,123456,1,'some answer value'),
        (123457,123456,123456,1,11111);
INSERT INTO user_files VALUES(123456,'ApiTestProband1',123456,123456,'somerandomimagebase64encodedstuff');
INSERT INTO questionnaire_instances_queued VALUES('ApiTestProband1',123456,'2021-03-04T15:45:16.409+01:00');
INSERT INTO questionnaire_instances_queued VALUES('ApiTestProband1',123457,'2021-03-04T15:45:16.409+01:00');

INSERT INTO pending_partial_deletions (id, requested_by, requested_for, proband_id, from_date, to_date, for_instance_ids, for_lab_results_ids, delete_logs)
 VALUES (1234560,'forscher1@apitest.de','forscher2@apitest.de','ApiTestProband1', '2021-01-01T01:00:00.000Z','2021-01-31T23:00:00.000Z',array[123456,123457],array['APISAMPLE_11111','APISAMPLE_11112'],true),
        (1234561,'forscher1@apitest.de','forscher2@apitest.de','ApiTestProband1', '2021-02-22T12:51:52.014+01:00','2021-03-04T12:51:52.018+01:00',array[123456,123457],null,false),
        (1234562,'forscher1@apitest.de','forscher2@apitest.de','ApiTestProband1', '2021-02-22T12:51:52.014+01:00','2021-03-04T12:51:52.018+01:00',null,array['APISAMPLE_11111','APISAMPLE_11112'],false);
