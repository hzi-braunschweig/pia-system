DELETE
FROM lab_observations
WHERE id IN (9999991, 9999992, 9999993, 9999994, 9999995, 9999996, 9999997, 9999998);

DELETE
FROM lab_results
WHERE id IN ('APITEST-123456789', 'APITEST-123456790', 'APITEST-123456791')
   OR user_id IN ('qtest-proband1');

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%';

DELETE
FROM studies
WHERE name LIKE 'QTest%';

DELETE
FROM lab_result_templates
WHERE study LIKE 'QTest%';
