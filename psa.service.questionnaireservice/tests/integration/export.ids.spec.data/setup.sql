BEGIN;

SET TIMEZONE = 'UTC';

--
-- Users and Studies
--

INSERT INTO studies (name, description, pm_email, hub_email, status, address, has_rna_samples, sample_prefix,
                     sample_suffix_length, has_answers_notify_feature, has_answers_notify_feature_by_mail,
                     has_four_eyes_opposition, has_partial_opposition, has_total_opposition, has_compliance_opposition,
                     has_logging_opt_in, pseudonym_prefix, pseudonym_suffix_length)
VALUES ('Teststudie - Export', 'Studie,        um die Integrationstest des Exports vorzubereiten (PIA-2585)', NULL,
        NULL, 'active', NULL, FALSE, 'ZIFCO', 10, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, FALSE, NULL, NULL);

INSERT INTO probands (pseudonym,
                      compliance_labresults,
                      compliance_samples,
                      needs_material,
                      study_center,
                      examination_wave,
                      compliance_bloodsamples,
                      is_test_proband,
                      status,
                      ids,
                      logging_active,
                      study)
VALUES ('test-1', FALSE, FALSE, FALSE, '.', 1, FALSE, FALSE, 'active', 'test-ids', TRUE, 'Teststudie - Export'),
       ('test-ids2', FALSE, FALSE, FALSE, '.', 1, FALSE, FALSE, 'active', 'test-ids2', TRUE, 'Teststudie - Export');

--
-- Questionnaires
--

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, expires_after_days,
                            finalises_after_days, created_at, type, version, publish, notify_when_not_filled,
                            notify_when_not_filled_time, notify_when_not_filled_day, cycle_per_day, cycle_first_hour,
                            keep_answers)
VALUES (297, 'Teststudie - Export', 'FB2_alle_Antworttypen_UT', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL,
        FALSE, 999999, 999999, '2021-06-08', 'for_research_team', 1, 'allaudiences', FALSE, NULL, NULL, NULL, NULL,
        FALSE);

INSERT INTO questions (id, questionnaire_id, text, "position", is_mandatory, variable_name, questionnaire_version)
VALUES (2620, 297, 'Es werden verschiedene Antworttypen durchgetestet.', 1, FALSE, '', 1);

INSERT INTO answer_options (id, question_id, text, answer_type_id, is_notable, "values", values_code, "position",
                            is_condition_target, restriction_min, restriction_max, is_decimal, variable_name)
VALUES (5987, 2620, 'Ist dies eine Einzelauswahl?', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, '');

--
-- Questionnaire Instances with Answers
--

INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status, notifications_scheduled,
                                     progress, release_version, questionnaire_version)
VALUES (17712543, 'Teststudie - Export', 297, 'FB2_alle_Antworttypen_UT', 'test-1', '2021-06-08 00:00:00', NULL, NULL,
        1, 'released', FALSE, 20, 2, 1),
       (17712544, 'Teststudie - Export', 297, 'FB2_alle_Antworttypen_UT', 'test-ids2', '2021-06-08 00:00:00', NULL,
        NULL, 1, 'released', FALSE, 20, 2, 1);

INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value, date_of_release,
                     releasing_person)
VALUES (17712543, 2620, 5987, 2, 'gelb;blau;', NULL, NULL),
       (17712544, 2620, 5987, 2, 'gelb;blau;', NULL, NULL);

--
-- Samples
--

INSERT INTO blood_samples (sample_id, user_id, remark, blood_sample_carried_out)
VALUES (1, 'test-1', 'TEST', TRUE),
       (2, 'test-ids2', 'TEST', TRUE);

INSERT INTO lab_results (id, user_id, status, remark, dummy_sample_id, study_status, date_of_sampling)
VALUES (1, 'test-1', 'analyzed', 'TEST', 0, 'active', '2010-01-01'),
       (2, 'test-ids2', 'analyzed', 'TEST', 0, 'active', '2010-01-01');

INSERT INTO lab_observations (name, name_id, lab_result_id, result_value, comment)
VALUES ('test1', 1, 1, 'test', 'test'),
       ('test2', 2, 2, 'test', 'test');

COMMIT;
