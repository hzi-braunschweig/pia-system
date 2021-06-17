DELETE
FROM users
WHERE username IN
      ('ApiTestProband1', 'ApiTestProband2', 'ApiTestProband3', 'ApiTestProband4', 'forscher1@apitest.de',
       'forscher2@apitest.de', 'ut1@apitest.de', 'ut2@apitest.de', 'pm1@apitest.de', 'pm2@apitest.de', 'pmNoEmail',
       'pm4@apitest.de', 'sa1@apitest.de', 'sa2@apitest.de', 'sa3@apitest.de');

DELETE
FROM studies
WHERE name IN ('ApiTestStudie1', 'ApiTestStudie2', 'ApiTestStudie3');

DELETE
FROM lab_results
WHERE id = 'APISAMPLE_11111';
DELETE
FROM planned_probands
WHERE user_id IN ('ApiPlannedTestName1', 'ApiPlannedTestName2');
