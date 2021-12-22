DELETE
FROM accounts
WHERE username LIKE 'QTest%' OR username IN ('QTestProband1', 'QTestProband2', 'QTestForscher1', 'ut@test.de', 'sysadmin@test.de',
                   'forscher@test.de', 'pm@test.de');

DELETE
FROM probands
WHERE pseudonym LIKE 'QTest%';

DELETE
FROM studies
WHERE name IN ('study1');
