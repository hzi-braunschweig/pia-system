DELETE
FROM notification_schedules
WHERE user_id LIKE 'qtest%';

DELETE
FROM fcm_tokens WHERE study LIKE 'QTest%';;

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
