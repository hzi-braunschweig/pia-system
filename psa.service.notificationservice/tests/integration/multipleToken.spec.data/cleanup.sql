DELETE
FROM notification_schedules
WHERE user_id LIKE 'QTest%';

DELETE
FROM fcm_tokens WHERE study LIKE 'QTest%';;

DELETE
FROM accounts
WHERE username LIKE 'QTest%';

DELETE
FROM probands
WHERE pseudonym LIKE 'QTest%';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
