DELETE
FROM accounts
WHERE username IN ('QTestProband1', 'QTestProband2', 'QTestProband3');
DELETE
FROM probands
WHERE pseudonym IN ('QTestProband1', 'QTestProband2', 'QTestProband3');

DELETE
FROM studies
WHERE name LIKE 'QTest%';
