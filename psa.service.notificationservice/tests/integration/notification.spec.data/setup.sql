INSERT INTO users (username, password, role, fcm_token, logged_in_with) VALUES
    ('QTestProband1', '', 'Proband', 'justarandomstring', 'android'),
    ('QTestProband2', '', 'Proband', '', null),
    ('QTestProband3', '', 'Proband', 'justarandomstring', 'ios'),
    ('QTestProband4', '', 'Proband', 'justarandomstring', 'ios'),
    ('QTestForscher1', '', 'Forscher', 'justarandomstring', 'web'),
    ('QTestProbandenManager', '', 'ProbandenManager', '', null),
    ('QTestUntersuchungsteam', '', 'Untersuchungsteam', '', null),
    ('QTestSystemAdmin', '', 'SysAdmin', '', null);

INSERT INTO studies (name, description, has_answers_notify_feature) VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung', true);

INSERT INTO study_users VALUES
    ('ApiTestStudie', 'QTestProband1', 'read'),
    ('ApiTestStudie', 'QTestProband2', 'read'),
    ('ApiTestStudie', 'QTestProband4', 'read'),
    ('ApiTestStudie', 'QTestForscher1', 'read'),
    ('ApiTestStudie', 'QTestProbandenManager', 'read'),
    ('ApiTestStudie', 'QTestUntersuchungsteam', 'read');

INSERT INTO questionnaires VALUES
    (
        99999,
        'ApiTestStudie',
        'ApiTestQuestionnaire',
        2,
        1,
        'week',
        1,
        365,
        3,
        'PIA Fragebogen',
        'NeuNachricht',
        'AltNachricht',
        null,
        null,
        null,
        null,
        true
    );

INSERT INTO questions VALUES
    (99991, 99999, 'Haben Sie Fieber?', 1, true),
    (99992, 99999, 'Wie fühlen Sie sich?', 1, true);

INSERT INTO answer_options (id, question_id, text, answer_type_id, is_notable, values, values_code, position,is_condition_target)
VALUES
       (99991, 99991, '', 1, '{true, false, false}', '{"Ja", "Nein", "Keine Angabe"}', null, 1, false),
       (99992, 99992, 'Kopf?', 2, '{}', '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', null, 1, false);

INSERT INTO questionnaire_instances VALUES
    (
        9999996,
        'ApiTestStudie',
        99999,
        'ApiTestQuestionnaire',
        'QTestProband1',
        '08.08.2017',
        null,
        null,
        1,
        'active'
    ),
    (
        9999997,
        'ApiTestStudie',
        99999,
        'ApiTestQuestionnaire',
        'QTestProband1',
        '08.08.2017',
        null,
        null,
        1,
        'in_progress'
    );

INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (9999996, 99991, 99991, 1, 'Ja'),
(9999996, 99992, 99992, 1, 'Schlecht');

INSERT INTO notification_schedules VALUES
    (99996, 'QTestProband1', '2019-07-09 09:56:00', 'qReminder', 99995, null, null),
    (99997, 'QTestProband1', '2019-07-09 09:56:00', 'qReminder', 9999996, null, null),
    (99998, 'QTestProband1', '2019-07-09 09:56:00', 'sample', 'LAB_RESULT-9999999999', null, null),
    (99999, 'QTestProband1', '2019-07-09 09:56:00', 'custom', '', 'I am custom title', 'Here is custom body');

INSERT INTO lab_results VALUES
    (
        'LAB_RESULT-9999999999',
        'QTestProband1',
        null,
        null,
        'new',
        'Das PM merkt an: bitte mit Vorsicht genießen!',
        false,
        'Dr. House',
        null
    );

