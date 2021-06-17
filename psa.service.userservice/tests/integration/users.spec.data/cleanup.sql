DELETE
FROM users
WHERE username LIKE 'QTest%'
   OR username LIKE '%@example.com';

DELETE
FROM studies
WHERE name LIKE 'QTestStudy%'
   OR name = 'ZIFCO-Studie';

DELETE
FROM planned_probands
WHERE user_id LIKE 'QTest%';
