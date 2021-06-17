DELETE
FROM study_users
WHERE user_id IN
      ('QTestProband1', 'QTestForscher1', 'QTestProband2', 'QTestForscher2', 'ut@apitest.de', 'ut2@apitest.de',
       'QTestProbandenManager');
DELETE
FROM users
WHERE username IN
      ('QTestProband1', 'QTestProband2', 'QTestForscher1', 'QTestForscher2', 'ut@apitest.de', 'ut2@apitest.de',
       'QTestSystemAdmin', 'QTestProbandenManager');
DELETE
FROM planned_probands
WHERE user_id IN ('planned1', 'planned2', 'planned3', 'planned4', 'planned5');
DELETE
FROM studies
WHERE name IN ('ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProband', 'ApiTestMultiProf');
