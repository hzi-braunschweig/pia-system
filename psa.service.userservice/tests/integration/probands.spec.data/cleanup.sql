DELETE
FROM accounts
WHERE username LIKE 'QTest%'
   OR username LIKE '%@example.com';

DELETE
FROM probands
WHERE pseudonym LIKE 'QTest%'
   OR pseudonym LIKE '%@example.com'
   OR study LIKE 'QTest%';

DELETE
FROM studies
WHERE name LIKE 'QTestStudy%'
   OR name = 'ZIFCO-Studie';

DELETE
FROM planned_probands
WHERE user_id LIKE 'QTest%';
