DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%'
   OR pseudonym LIKE '%@example.com';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
