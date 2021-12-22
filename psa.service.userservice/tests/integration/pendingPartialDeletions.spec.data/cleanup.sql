DELETE
FROM accounts
WHERE username LIKE 'QTest%'
   OR username LIKE '%@example.com'
   OR username IN ('forscherNoEmail');

DELETE
FROM probands
WHERE pseudonym LIKE 'QTest%'
   OR pseudonym LIKE '%@example.com'
   OR pseudonym IN ('forscherNoEmail');

DELETE
FROM studies
WHERE name LIKE 'QTest%';
