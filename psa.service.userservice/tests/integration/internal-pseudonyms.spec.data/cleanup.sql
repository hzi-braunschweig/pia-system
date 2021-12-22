DELETE
FROM accounts
WHERE username IN
      ('ApiTestProband1', 'ApiTestProband2', 'ApiTestProband3', 'ApiTestProband4');
DELETE
FROM probands
WHERE pseudonym IN
      ('ApiTestProband1', 'ApiTestProband2', 'ApiTestProband3', 'ApiTestProband4');

DELETE
FROM studies
WHERE name IN ('ApiTestStudie1', 'ApiTestStudie2', 'ApiTestStudie3');
