DELETE FROM accounts;
DELETE FROM probands;

DELETE
FROM studies
WHERE name LIKE 'QTest%';

DELETE
FROM pending_study_changes
WHERE study_id LIKE 'QTest%';
