DELETE
FROM notification_schedules
WHERE user_id IN (
                  'QTestProband1',
                  'QTestProband2',
                  'QTestProband4',
                  'QTestForscher1',
                  'QTestProbandenManager',
                  'QTestUntersuchungsteam'
    );

DELETE
FROM study_users
WHERE user_id IN (
                  'QTestProband1',
                  'QTestProband2',
                  'QTestProband4',
                  'QTestForscher1',
                  'QTestProbandenManager',
                  'QTestUntersuchungsteam'
    );

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
FROM users
WHERE username IN (
                   'QTestProband1',
                   'QTestProband2',
                   'QTestProband3',
                   'QTestProband4',
                   'QTestProbandenManager',
                   'QTestForscher1',
                   'QTestUntersuchungsteam',
                   'QTestSystemAdmin'
    );


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
