DELETE
FROM lab_observations
WHERE id IN (9999991, 9999992, 9999993, 9999994, 9999995, 9999996, 9999997, 9999998);
DELETE
FROM lab_results
WHERE id IN ('APITEST-123456789', 'APITEST-123456790', 'APITEST-123456791')
   OR user_id IN ('QTestProband1');
DELETE
FROM study_users
WHERE user_id IN
      ('QTestProband1', 'QTestForscher1', 'QTestProband2', 'QTestProbandenManager', 'QTestUntersuchungsteam');
DELETE
FROM users
WHERE username IN
      ('QTestProband1', 'QTestProband2', 'QTestProbandenManager', 'QTestForscher1', 'QTestUntersuchungsteam',
       'QTestSystemAdmin');
DELETE
FROM studies
WHERE name IN ('ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProband', 'ApiTestMultiProf');
