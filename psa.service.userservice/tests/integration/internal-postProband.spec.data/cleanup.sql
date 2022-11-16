DELETE
FROM planned_probands
WHERE user_id LIKE 'qtest%';

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
