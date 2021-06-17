DELETE FROM notification_schedules WHERE user_id IN (
    'QTestProband1',
    'QTestProband2',
    'QTestProband4',
    'QTestForscher1',
    'QTestProbandenManager',
    'QTestUntersuchungsteam'
);

DELETE FROM study_users WHERE user_id IN (
    'QTestProband1',
    'QTestProband2',
    'QTestProband4',
    'QTestForscher1',
    'QTestProbandenManager',
    'QTestUntersuchungsteam'
);

DELETE FROM users WHERE username IN (
    'QTestProband1',
    'QTestProband2',
    'QTestProband3',
    'QTestProband4',
    'QTestProbandenManager',
    'QTestForscher1',
    'QTestUntersuchungsteam',
    'QTestSystemAdmin'
);

DELETE FROM studies WHERE name = 'ApiTestStudie';
