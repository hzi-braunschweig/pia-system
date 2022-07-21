DELETE
FROM probands
WHERE pseudonym IN
      ('qtest-api-proband1', 'qtest-api-proband2', 'qtest-api-proband3', 'qtest-api-proband4', 'qtest-api-proband5');

DELETE
FROM studies
WHERE name IN ('ApiTestStudie1', 'ApiTestStudie2', 'ApiTestStudie3');
