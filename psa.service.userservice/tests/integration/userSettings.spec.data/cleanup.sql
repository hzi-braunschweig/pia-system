DELETE
FROM accounts
WHERE username LIKE 'QTest%'
   OR username LIKE '%@example.com';

DELETE
FROM probands
WHERE pseudonym LIKE 'QTest%'
   OR pseudonym LIKE '%@example.com';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
