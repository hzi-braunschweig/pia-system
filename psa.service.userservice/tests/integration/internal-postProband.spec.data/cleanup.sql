DELETE
FROM probands
WHERE pseudonym IN ('qtest-proband1', 'qtest-proband2', 'qtest-proband3');

DELETE
FROM studies
WHERE name LIKE 'QTest%';
