INSERT INTO users (username, password, role, fcm_token, logged_in_with)
VALUES ('QTestProband1', '', 'Proband', 'justarandomstring', 'web'),
       ('QTestProband2', '', 'Proband', '', null),
       ('QTestProband3', '', 'Proband', 'justarandomstring', 'ios'),
       ('QTestProband4', '', 'Proband', 'justarandomstring', 'ios'),
       ('QTestForscher1', '', 'Forscher', 'justarandomstring', 'web'),
       ('QTestProbandenManager', '', 'ProbandenManager', '', null),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam', '', null),
       ('QTestSystemAdmin', '', 'SysAdmin', '', null);

INSERT INTO studies (name, description, status, has_answers_notify_feature, has_answers_notify_feature_by_mail,
                     pm_email, hub_email)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung', 'active', true, true, 'pm@pia.test', 'hub@pia.test');

INSERT INTO study_users
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie', 'QTestProband2', 'read'),
       ('ApiTestStudie', 'QTestProband4', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'read'),
       ('ApiTestStudie', 'QTestProbandenManager', 'read'),
       ('ApiTestStudie', 'QTestUntersuchungsteam', 'read');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, notify_when_not_filled,
                            notify_when_not_filled_time, notify_when_not_filled_day)
VALUES (99998,
        'ApiTestStudie',
        'ApiTestQuestionnaire 2',
        2,
        1,
        'spontan',
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
        true, true, '00:00', 0),
       (99999,
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
        true, true, '00:00', 0);

INSERT INTO questions (id, questionnaire_id, text, position, is_mandatory)
VALUES (99991, 99999, 'Haben Sie Fieber?', 1, true),
       (99992, 99999, 'Wie fühlen Sie sich?', 2, true),
       (99993, 99999, 'Wie fühlen Sie sich heute (external condition)?', 3, true),
       (99994, 99998, 'Wie hoch ist Ihres Fieber?', 2, true),
       (99995, 99998, 'Wie fühlen Sie sich?', 2, true);

INSERT INTO answer_options (id, question_id, text, answer_type_id, is_notable, values, values_code, position,
                            is_condition_target)
VALUES (99991, 99991, '', 1, '{true, false, false}', '{"Ja", "Nein", "Keine Angabe"}', null, 1, false),
       (99992, 99992, 'Kopf?', 2, '{true, true, false, false}', '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', null,
        1, false),
       (99993, 99993, 'Kopf?', 2, '{true, true, false, false}', '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', null,
        1, false),
       (99994, 99994, '', 3, '{}', '{}', null, 1, false),
       (99995, 99994, 'Kopf?', 2, '{true, true, false, false}', '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', null,
        1, false);


INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (9999996,
        'ApiTestStudie',
        99999,
        'ApiTestQuestionnaire',
        'QTestProband1',
        '08.08.2017',
        null,
        null,
        1,
        'active'),
       (9999997,
        'ApiTestStudie',
        99999,
        'ApiTestQuestionnaire',
        'QTestProband1',
        '08.08.2017',
        null,
        null,
        1,
        'in_progress'),
       (9999998,
        'ApiTestStudie',
        99998,
        'ApiTestQuestionnaire',
        'QTestProband1',
        '01.08.2017',
        '06.08.2017',
        null,
        2,
        'released_once');

INSERT INTO conditions (id, condition_type, condition_answer_option_id, condition_question_id,
                        condition_questionnaire_id,
                        condition_operand, condition_value, condition_target_answer_option,
                        condition_target_questionnaire, condition_link)
VALUES
       (9999994, 'external', null, 99993, null, '\=', 'Ja', 99995, 99998, 'AND'),

       (9999998, 'internal_last', null, 99994, null, '<=', '39', 99995, 99998, 'AND'),

       (99999910, 'internal_last', 99992, null, null, '==', 'Ja', 99993, 99998, null),

       (9999999, 'internal_this', 99991, null, null, '==', 'Ja', 99993, 99998, null);


INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (9999996, 99991, 99991, 1, 'Ja'),
       (9999996, 99992, 99992, 1, 'Schlecht'),
       (9999996, 99993, 99993, 1, 'Schlecht'),
       (9999998, 99994, 99994, 1, '37'),
       (9999998, 99994, 99995, 1, 'Ja');


INSERT INTO notification_schedules
VALUES (99996, 'QTestProband1', '2019-07-09 09:56:00', 'qReminder', 99995, null, null),
       (99997, 'QTestProband1', '2019-07-09 09:56:00', 'qReminder', 9999996, null, null),
       (99998, 'QTestProband1', '2019-07-09 09:56:00', 'sample', 'LAB_RESULT-9999999999', null, null),
       (99999, 'QTestProband1', '2019-07-09 09:56:00', 'custom', '', 'I am custom title', 'Here is custom body'),
       (99991, 'QTestProband1', '2019-07-09 09:56:00', 'questionnaires_stats_aggregator', '', 'I am custom title', 'Here is custom body');

INSERT INTO lab_results (id, user_id, order_id, date_of_sampling, status, remark, new_samples_sent, performing_doctor,
                         dummy_sample_id)
VALUES ('LAB_RESULT-9999999999',
        'QTestProband1',
        null,
        null,
        'new',
        'Das PM merkt an: bitte mit Vorsicht genießen!',
        false,
        'Dr. House',
        null);

