DELETE
FROM users
WHERE username IN
      ('QTestProband1', 'QTestForscher1', 'QTestUntersucher', 'QTestProbandenManager', 'QTestEinwilligungsManager',
       'QTestSystemAdmin')
   OR username LIKE 'APITEST-%'
   OR ids = 'AAA-BBB-CCC-DDD';

DELETE
FROM studies
WHERE name IN ('ApiTestStudy1', 'ApiTestStudy2', 'ApiTestStudy3');
