DELETE
FROM blood_samples
WHERE sample_id IN ('ZIFCO-1234567890', 'ZIFCO-1234567899', 'ZIFCO-1111111111');
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
