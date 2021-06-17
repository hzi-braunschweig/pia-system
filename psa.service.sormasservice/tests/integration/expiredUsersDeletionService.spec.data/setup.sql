INSERT INTO users (username, password, role) VALUES
    ('DoNotDeleteUser1', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoNotDeleteUser2', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoNotDeleteUser3', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoNotDeleteUser4', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoNotDeleteUser5', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoDeleteUser1', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoDeleteUser2', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoDeleteUser3', 'dafb7a7b4ae61f8c9dc', 'Proband'),
    ('DoDeleteUser4', 'dafb7a7b4ae61f8c9dc', 'Proband');

INSERT INTO studies (name) VALUES ('SORMAS Teststudie');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress) VALUES
    (9876543, 'SORMAS Teststudie', 'Testfragebogen', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht');


INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue, date_of_release_v1, date_of_release_v2, cycle, status, notifications_scheduled, progress, release_version, questionnaire_version, transmission_ts_v1, transmission_ts_v2) VALUES
    (1000001, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser1', now(), now(), now(), 14, 'inactive', false, 0, 0, 1, null, null),
    (1000002, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser1', now(), now(), now(), 14, 'active', false, 0, 0, 1, null, null),
    (1000003, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser1', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', '2020-08-19 10:00:00'),
    (1000004, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser2', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, null, null),
    (1000005, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser2', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, null, null),
    (1000006, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser3', now(), now(), now(), 14, 'in_progress', false, 0, 0, 1, null, null),
    (1000017, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser4', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, null, '2020-08-19 10:00:00'),
    (1000018, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoNotDeleteUser5', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', null),
    (1000007, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser1', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', '2020-08-19 10:00:00'),
    (1000008, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser1', now(), null, null, 14, 'expired', false, 0, 0, 1, null, null),
    (1000009, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser2', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', '2020-08-19 10:00:00'),
    (1000010, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser2', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', '2020-08-19 10:00:00'),
    (1000011, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser3', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', '2020-08-19 10:00:00'),
    (1000012, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser3', now(), now(), now(), 14, 'released_twice', false, 0, 0, 1, '2020-08-19 10:00:00', '2020-08-19 10:00:00'),
    (1000013, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser3', now(), null, null, 14, 'expired', false, 0, 0, 1, null, null),
    (1000014, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser4', now(), null, null, 14, 'expired', false, 0, 0, 1, null, null),
    (1000015, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser4', now(), null, null, 14, 'expired', false, 0, 0, 1, null, null),
    (1000016, 'SORMAS Teststudie', 9876543, 'Testfragebogen', 'DoDeleteUser4', now(), null, null, 14, 'expired', false, 0, 0, 1, null, null);
