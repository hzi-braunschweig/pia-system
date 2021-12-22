DELETE
FROM accounts
WHERE username LIKE 'ApiTest%'
   OR username LIKE '%apitest.de'
   OR username IN ('pmNoEmail');

DELETE
FROM probands
WHERE pseudonym LIKE 'ApiTest%'
   OR pseudonym LIKE '%apitest.de'
   OR pseudonym IN ('pmNoEmail');

DELETE
FROM studies
WHERE name LIKE 'ApiTest%';

DELETE
FROM lab_results
WHERE id = 'APISAMPLE_11111';
DELETE
FROM planned_probands
WHERE user_id IN ('ApiPlannedTestName1', 'ApiPlannedTestName2');
