DELETE
FROM notification_schedules
WHERE user_id IN (
                  'QTestProband1',
                  'QTestProbandenManager'
);

DELETE FROM fcm_tokens;

DELETE
FROM study_users
WHERE user_id IN (
                  'QTestProband1',
                  'QTestProbandenManager'
);

DELETE
FROM users
WHERE username IN (
                   'QTestProband1',
                   'QTestProbandenManager'
);


DELETE
FROM studies
WHERE name = 'ApiTestStudie';
