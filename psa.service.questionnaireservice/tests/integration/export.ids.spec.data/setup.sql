BEGIN;

SET TIMEZONE='UTC';

INSERT INTO users (
    username,
    password,
    role,
    first_logged_in_at,
    logged_in_with,
    compliance_labresults,
    compliance_samples,
    needs_material,
    pw_change_needed,
    number_of_wrong_attempts,
    third_wrong_password_at,
    study_center,
    examination_wave,
    compliance_bloodsamples,
    is_test_proband,
    account_status,
    study_status,
    ids,
    logging_active,
    salt,
    initial_password_validity_date,
    mapping_id
) VALUES (
    'test-1',
    '',
    'Proband',
    NULL,
    NULL,
    false,
    false,
    false,
    true,
    NULL,
    NULL,
    '.',
    1,
    false,
    false,
    'active',
    'active',
    'test-ids',
    true,
    '',
    '2021-06-14 09:19:07.482',
    'ed996ad0-37bb-40e8-9d43-bbdd631a7b1a'
);

INSERT INTO users (
    username,
    password,
    role,
    first_logged_in_at,
    logged_in_with,
    compliance_labresults,
    compliance_samples,
    needs_material,
    pw_change_needed,
    number_of_wrong_attempts,
    third_wrong_password_at,
    study_center,
    examination_wave,
    compliance_bloodsamples,
    is_test_proband,
    account_status,
    study_status,
    ids,
    logging_active,
    salt,
    initial_password_validity_date,
    mapping_id
) VALUES (
    'test-2',
    '',
    'Proband',
    NULL,
    NULL,
    false,
    false,
    false,
    true,
    NULL,
    NULL,
    '.',
    1,
    false,
    false,
    'no_account',
    'active',
    'test-ids2',
    true,
    '',
    '2021-06-14 09:19:07.482',
    'ed996ad0-37bb-40e8-9d43-bbdd631a7b1b'
);

INSERT INTO studies (
    name,
    description,
    pm_email,
    hub_email,
    status,
    address,
    has_rna_samples,
    sample_prefix,
    sample_suffix_length,
    has_answers_notify_feature,
    has_answers_notify_feature_by_mail,
    has_four_eyes_opposition,
    has_partial_opposition,
    has_total_opposition,
    has_compliance_opposition,
    has_logging_opt_in,
    pseudonym_prefix,
    pseudonym_suffix_length
) VALUES (
    'Teststudie - Export',
    'Studie,
    um die Integrationstest des Exports vorzubereiten (PIA-2585)',
    NULL,
    NULL,
    'active',
    NULL,
    false,
    'ZIFCO',
    10,
    false,
    false,
    false,
    true,
    true,
    true,
    false,
    NULL,
    NULL
);

INSERT INTO study_users (
    study_id,
    user_id,
    access_level
) VALUES (
    'Teststudie - Export',
    'test-1',
    'read'
);

INSERT INTO study_users (
    study_id,
    user_id,
    access_level
) VALUES (
    'Teststudie - Export',
    'test-2',
    'read'
);

INSERT INTO questionnaires (
    id,
    study_id,
    name,
    no_questions,
    cycle_amount,
    cycle_unit,
    activate_after_days,
    deactivate_after_days,
    notification_tries,
    notification_title,
    notification_body_new,
    notification_body_in_progress,
    notification_weekday,
    notification_interval,
    notification_interval_unit,
    activate_at_date,
    compliance_needed,
    expires_after_days,
    finalises_after_days,
    created_at,
    type,
    version,
    publish,
    notify_when_not_filled,
    notify_when_not_filled_time,
    notify_when_not_filled_day,
    cycle_per_day,
    cycle_first_hour,
    keep_answers
) VALUES (
    297,
    'Teststudie - Export',
    'FB2_alle_Antworttypen_UT',
    1,
    1,
    'once',
    0,
    1,
    0,
    '',
    '',
    '',
    '',
    0,
    '',
    NULL,
    false,
    999999,
    999999,
    '2021-06-08',
    'for_research_team',
    1,
    'allaudiences',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    false
);

INSERT INTO questions (
    id,
    questionnaire_id,
    text,
    "position",
    is_mandatory,
    label,
    questionnaire_version
) VALUES (
    2620,
    297,
    'Es werden verschiedene Antworttypen durchgetestet.',
    1,
    false,
    '',
    1
);

INSERT INTO answer_options (
    id,
    question_id,
    text,
    answer_type_id,
    is_notable,
    "values",
    values_code,
    "position",
    is_condition_target,
    restriction_min,
    restriction_max,
    is_decimal,
    label
) VALUES (
    5987,
    2620,
    'Ist dies eine Einzelauswahl?',
    1,
    '{f,f}',
    '{Ja,Nein}',
    '{1,0}',
    1,
    false,
    NULL,
    NULL,
    false,
    ''
);

INSERT INTO questionnaire_instances (
    id,
    study_id,
    questionnaire_id,
    questionnaire_name,
    user_id,
    date_of_issue,
    date_of_release_v1,
    date_of_release_v2,
    cycle,
    status,
    notifications_scheduled,
    progress,
    release_version,
    questionnaire_version,
    transmission_ts_v1,
    transmission_ts_v2
) VALUES (
    17712543,
    'Teststudie - Export',
    297,
    'FB2_alle_Antworttypen_UT',
    'test-1',
    '2021-06-08 00:00:00',
    NULL,
    NULL,
    1,
    'released',
    false,
    20,
    2,
    1,
    NULL,
    NULL
);

INSERT INTO questionnaire_instances (
    id,
    study_id,
    questionnaire_id,
    questionnaire_name,
    user_id,
    date_of_issue,
    date_of_release_v1,
    date_of_release_v2,
    cycle,
    status,
    notifications_scheduled,
    progress,
    release_version,
    questionnaire_version,
    transmission_ts_v1,
    transmission_ts_v2
) VALUES (
    17712544,
    'Teststudie - Export',
    297,
    'FB2_alle_Antworttypen_UT',
    'test-2',
    '2021-06-08 00:00:00',
    NULL,
    NULL,
    1,
    'released',
    false,
    20,
    2,
    1,
    NULL,
    NULL
);

INSERT INTO answers (
    questionnaire_instance_id,
    question_id,
    answer_option_id,
    versioning,
    value,
    date_of_release,
    releasing_person
) VALUES (
    17712543,
    2620,
    5987,
    2,
    'gelb;blau;',
    NULL,
    NULL
);

INSERT INTO answers (
    questionnaire_instance_id,
    question_id,
    answer_option_id,
    versioning,
    value,
    date_of_release,
    releasing_person
) VALUES (
    17712544,
    2620,
    5987,
    2,
    'gelb;blau;',
    NULL,
    NULL
);

INSERT INTO blood_samples (
    sample_id,
    user_id,
    remark,
    blood_sample_carried_out
) VALUES (
    1,
    'test-1',
    'TEST',
    true
);

INSERT INTO blood_samples (
    sample_id,
    user_id,
    remark,
    blood_sample_carried_out
) VALUES (
    2,
    'test-2',
    'TEST',
    true
);

INSERT INTO lab_results (
    id,
    user_id,
    status,
    remark,
    dummy_sample_id,
    study_status,
    date_of_sampling
) VALUES (
    1,
    'test-1',
    'analyzed',
    'TEST',
    0,
    'active',
    '2010-01-01'
);

INSERT INTO lab_results (
    id,
    user_id,
    status,
    remark,
    dummy_sample_id,
    study_status,
    date_of_sampling
) VALUES (
    2,
    'test-2',
    'analyzed',
    'TEST',
    0,
    'active',
    '2010-01-01'
);

INSERT INTO lab_observations (
    name,
    name_id,
    lab_result_id,
    result_value,
    comment
) VALUES (
    'test1',
    1,
    1,
    'test',
    'test'
);

INSERT INTO lab_observations (
    name,
    name_id,
    lab_result_id,
    result_value,
    comment
) VALUES (
    'test2',
    2,
    2,
    'test',
    'test'
);

-- add the forscher
INSERT INTO users(
    username,
    password,
    role,
    compliance_labresults,
    compliance_samples
) VALUES (
    'QExportTestForscher',
    '',
    'Forscher',
    true,
    true
);
INSERT INTO study_users (
    study_id,
    user_id,
    access_level
) VALUES (
    'Teststudie - Export',
    'QExportTestForscher',
    'write'
);

COMMIT;
