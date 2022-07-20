DELETE
FROM notification_schedules
WHERE user_id IN (
                  'qtest-proband1',
                  'qtest-proband2',
                  'qtest-proband4',
                  'qtest-forscher1',
                  'qtest-probandenmanager',
                  'qtest-untersuchungsteam'
    );

DELETE FROM fcm_tokens;

DELETE
FROM answers
WHERE questionnaire_instance_id IN (
    9999996
    );

DELETE
FROM answer_options
WHERE id IN (
             99991, 99992, 99993, 99994, 99995
    );

DELETE
FROM conditions;


DELETE
FROM questions
WHERE id IN (
             99991,
             99992,
             99993,
             99994
    );

DELETE
FROM questionnaire_instances
WHERE id IN (
             9999996,
             9999997,
             9999998
    );

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%';


DELETE
FROM questionnaires
WHERE id IN (
             99999, 99998
    );

DELETE
FROM lab_results;

DELETE
FROM lab_observations;


DELETE
FROM studies
WHERE name = 'ApiTestStudie';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
