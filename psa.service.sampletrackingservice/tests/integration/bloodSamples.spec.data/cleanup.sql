DELETE
FROM blood_samples
WHERE sample_id IN ('ZIFCO-1234567890', 'ZIFCO-1234567891', 'ZIFCO-1234567892', 'ZIFCO-1234567898', 'ZIFCO-1234567899',
                    'ZIFCO-1111111111');

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
