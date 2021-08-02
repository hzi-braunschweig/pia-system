DELETE
FROM studies
WHERE name IN
      ('ApiTestMultiProbands', 'ApiTestMultiProfs', 'ApiTestStudie', 'ApiTestStudi2', 'ApiTestStudi3', 'ApiTestStudi4',
       'NewApiTestStudie', 'NewApiTestStudie2', 'NewApiTestStudie3', 'NewApiTestStudieChanged', 'ExportTestStudie');
DELETE
FROM users
WHERE username IN ('QTestProband1', 'QTestProband2', 'QTestForscher1', 'QTestForscher2', 'QTestUntersuchungsteam',
                   'QTestUntersuchungsteam2', 'QTestProband3', 'QTestProband4', 'QTestProband5',
                   'QTestProbandenManager', 'QTestSysAdmin', 'QExportTestProband1', 'QExportTestProband2',
                   'QExportTestForscher');
DELETE
FROM conditions
WHERE condition_target_questionnaire IN (888888, 888889, 777777);
