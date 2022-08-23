DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%'
   OR pseudonym LIKE '%@example.com';

DELETE
FROM studies
WHERE name LIKE 'QTestStudy%'
   OR name = 'ZIFCO-Studie';

DELETE
FROM planned_probands
WHERE user_id LIKE 'qtest%';
