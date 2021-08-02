DELETE
FROM conditions
WHERE condition_target_questionnaire IN (888888, 888889, 777777, 100200, 200200, 200300);

DELETE
FROM studies
WHERE name IN
      ('ApiTestStudy1', 'ApiTestStudy2', 'ApiTestStudy3');
DELETE
FROM users
WHERE username IN
      ('QTestProband1', 'QTestProband2', 'QTestProband3', 'QTestProband4', 'QTestProband5', 'QTestForscher1',
       'QTestForscher2', 'QTestUntersuchungsteam', 'QTestProbandenManager', 'QTestSysAdmin');
