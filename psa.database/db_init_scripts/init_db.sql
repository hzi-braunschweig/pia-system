CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE studies (
    name TEXT PRIMARY KEY,
    description TEXT,
    pm_email TEXT NULL,
    hub_email TEXT NULL,
    status TEXT DEFAULT 'active',
    address TEXT NULL,
    has_rna_samples BOOLEAN DEFAULT true,
    sample_prefix TEXT DEFAULT 'ZIFCO',
    sample_suffix_length INT DEFAULT 10,
    pseudonym_prefix TEXT DEFAULT 'PIA',
    pseudonym_suffix_length INT DEFAULT 8,
    has_answers_notify_feature BOOLEAN DEFAULT false,
    has_answers_notify_feature_by_mail BOOLEAN DEFAULT false,
    has_four_eyes_opposition BOOLEAN DEFAULT true,
    has_partial_opposition BOOLEAN DEFAULT true,
    has_total_opposition BOOLEAN DEFAULT true,
    has_compliance_opposition BOOLEAN DEFAULT true,
    has_logging_opt_in BOOLEAN DEFAULT false
);

CREATE TABLE study_welcome_text (
    study_id TEXT NOT NULL,
    welcome_text TEXT DEFAULT NULL,
    language TEXT DEFAULT 'de_DE',
    PRIMARY KEY (study_id, language),
    CONSTRAINT fk_study_id
    FOREIGN KEY (study_id)
    REFERENCES studies(name)
    ON DELETE CASCADE
);

CREATE TYPE type_publish AS ENUM ('hidden', 'testprobands', 'allaudiences');

CREATE TABLE questionnaires (
    id SERIAL,
    study_id TEXT,
    name TEXT NOT NULL,
    no_questions INT NOT NULL,
    cycle_amount INT,
    cycle_unit TEXT NULL,
    activate_after_days INT NOT NULL,
    deactivate_after_days INT NOT NULL,
    notification_tries INT NOT NULL,
    notification_title TEXT NOT NULL,
    notification_body_new TEXT NOT NULL,
    notification_body_in_progress TEXT NOT NULL,
    notification_weekday TEXT NULL,
    notification_interval INT NULL,
    notification_interval_unit TEXT NULL,
    activate_at_date DATE NULL,
    compliance_needed BOOLEAN DEFAULT false,
    expires_after_days INT NOT NULL DEFAULT 5,
    finalises_after_days INT NOT NULL DEFAULT 2,
    created_at DATE DEFAULT CURRENT_DATE,
    type TEXT DEFAULT 'for_probands',
    version integer NOT NULL DEFAULT 1,
    publish type_publish DEFAULT 'allaudiences',
    notify_when_not_filled BOOLEAN DEFAULT false,
    notify_when_not_filled_time TEXT NULL,
    notify_when_not_filled_day INT NULL,
    cycle_per_day INT NULL,
    cycle_first_hour INT NULL,
    keep_answers BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT fk_study_id
        FOREIGN KEY (study_id)
        REFERENCES studies(name)
        ON DELETE CASCADE
);

ALTER TABLE questionnaires ADD PRIMARY KEY (id, version);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    questionnaire_id SERIAL,
    text TEXT NOT NULL,
    position INT NOT NULL,
    is_mandatory BOOLEAN,
    label TEXT DEFAULT '',
    questionnaire_version integer NOT NULL DEFAULT 1,
    CONSTRAINT fk_questionnaire_id
        FOREIGN KEY (questionnaire_id, questionnaire_version)
        REFERENCES questionnaires(id, version)
        ON DELETE CASCADE
);

CREATE TABLE answer_types (
    id SERIAL PRIMARY KEY,
    type text
);

CREATE TABLE answer_options (
    id SERIAL PRIMARY KEY,
    question_id SERIAL,
    text TEXT,
    answer_type_id SERIAL,
    is_notable BOOLEAN[] DEFAULT '{}',
    values TEXT[],
    values_code INT[] NULL,
    position INT NOT NULL,
    is_condition_target BOOLEAN DEFAULT false,
    restriction_min DECIMAL,
    restriction_max DECIMAL,
    is_decimal BOOLEAN,
    label TEXT DEFAULT '',
    CONSTRAINT fk_question_id
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_answer_type_id
        FOREIGN KEY (answer_type_id)
        REFERENCES answer_types(id)
        ON DELETE CASCADE
);

CREATE TABLE conditions (
    condition_type TEXT,
    condition_answer_option_id INT NULL,
    condition_question_id INT NULL,
    condition_questionnaire_id INT NULL,
    condition_operand TEXT,
    condition_value TEXT,
    condition_target_answer_option INT NULL,
    condition_target_questionnaire INT NULL,
    id SERIAL PRIMARY KEY,
    condition_link TEXT,
    condition_questionnaire_version integer NOT NULL DEFAULT 1,
    condition_target_questionnaire_version integer DEFAULT 1,
    CONSTRAINT fk_condition_answer_option
        FOREIGN KEY (condition_answer_option_id)
        REFERENCES answer_options(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_condition_question
        FOREIGN KEY (condition_question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_condition_questionnaire
        FOREIGN KEY (condition_questionnaire_id, condition_questionnaire_version)
        REFERENCES questionnaires(id, version)
        ON DELETE CASCADE,
    CONSTRAINT fk_condition_target_answer_option
        FOREIGN KEY (condition_target_answer_option)
        REFERENCES answer_options(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_condition_target_questionnaire
        FOREIGN KEY (condition_target_questionnaire, condition_target_questionnaire_version)
        REFERENCES questionnaires(id, version)
        ON DELETE SET NULL
);

CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    fcm_token TEXT,
    first_logged_in_at DATE NULL,
    notification_time TIME NULL,
    logged_in_with TEXT NULL,
    compliance_labresults BOOLEAN DEFAULT true,
    compliance_samples BOOLEAN DEFAULT true,
    needs_material BOOLEAN DEFAULT false,
    pw_change_needed BOOLEAN DEFAULT true,
    number_of_wrong_attempts INT,
    third_wrong_password_at TIMESTAMP NULL,
    study_center TEXT DEFAULT NULL,
    examination_wave INT DEFAULT 1,
    compliance_bloodsamples BOOLEAN DEFAULT true,
    is_test_proband BOOLEAN DEFAULT false,
    account_status TEXT DEFAULT 'active',
    study_status TEXT DEFAULT 'active',
    ids TEXT UNIQUE NULL,
    logging_active BOOLEAN DEFAULT true,
    salt TEXT NULL,
    initial_password_validity_date TIMESTAMP NULL,
    mapping_id uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_unique_username ON users (UPPER(username));

CREATE TABLE users_to_contact (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    notable_answer_questionnaire_instances INTEGER [] DEFAULT '{}',
    is_notable_answer BOOLEAN NULL,
    is_notable_answer_at timestamp NULL,
    not_filledout_questionnaire_instances INTEGER [] DEFAULT '{}',
    is_not_filledout BOOLEAN NULL,
    is_not_filledout_at timestamp NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at timestamp NULL,
    created_at timestamp DEFAULT NOW(),
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE pending_deletions (
    id SERIAL PRIMARY KEY,
    requested_by TEXT NOT NULL,
    requested_for TEXT NOT NULL,
    type TEXT NOT NULL,
    for_id TEXT NOT NULL,
    CONSTRAINT fk_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_requested_for
        FOREIGN KEY (requested_for)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE pending_partial_deletions (
    id SERIAL PRIMARY KEY,
    requested_by TEXT NOT NULL,
    requested_for TEXT NOT NULL,
    proband_id TEXT NOT NULL,
    from_date TIMESTAMP NULL,
    to_date TIMESTAMP NULL,
    delete_logs BOOLEAN NULL,
    for_instance_ids INT[] NULL,
    for_lab_results_ids TEXT[] NULL,
    CONSTRAINT fk_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_requested_for
        FOREIGN KEY (requested_for)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_proband_id
        FOREIGN KEY (proband_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE one_time_auth_token
(
    token char(64) not null,
    created_at timestamp DEFAULT NOW()
);

COMMENT ON TABLE one_time_auth_token is 'Creates one time auth tokens for PIA Sormas authentication';

CREATE UNIQUE INDEX one_time_auth_token_token_uindex
    ON one_time_auth_token (token);

CREATE TABLE pending_compliance_changes (
    id SERIAL PRIMARY KEY,
    requested_by TEXT NOT NULL,
    requested_for TEXT NOT NULL,
    proband_id TEXT NOT NULL,
    compliance_labresults_from BOOLEAN NOT NULL,
    compliance_labresults_to BOOLEAN NOT NULL,
    compliance_samples_from BOOLEAN NOT NULL,
    compliance_samples_to BOOLEAN NOT NULL,
    compliance_bloodsamples_from BOOLEAN NOT NULL,
    compliance_bloodsamples_to BOOLEAN NOT NULL,
    CONSTRAINT fk_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_requested_for
        FOREIGN KEY (requested_for)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_proband_id
        FOREIGN KEY (proband_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE pending_study_changes (
    id SERIAL PRIMARY KEY,
    requested_by TEXT NOT NULL,
    requested_for TEXT NOT NULL,
    study_id TEXT NOT NULL,
    description_from TEXT,
    description_to TEXT,
    has_rna_samples_from BOOLEAN NOT NULL,
    has_rna_samples_to BOOLEAN NOT NULL,
    sample_prefix_from TEXT,
    sample_prefix_to TEXT,
    sample_suffix_length_from INT,
    sample_suffix_length_to INT,
    pseudonym_prefix_from TEXT,
    pseudonym_prefix_to TEXT,
    pseudonym_suffix_length_from INT,
    pseudonym_suffix_length_to INT,
    has_answers_notify_feature_from BOOLEAN NOT NULL,
    has_answers_notify_feature_to BOOLEAN NOT NULL,
    has_answers_notify_feature_by_mail_from BOOLEAN NOT NULL,
    has_answers_notify_feature_by_mail_to BOOLEAN NOT NULL,
    has_four_eyes_opposition_from BOOLEAN NOT NULL,
    has_four_eyes_opposition_to BOOLEAN NOT NULL,
    has_partial_opposition_from BOOLEAN NOT NULL,
    has_partial_opposition_to BOOLEAN NOT NULL,
    has_total_opposition_from BOOLEAN NOT NULL,
    has_total_opposition_to BOOLEAN NOT NULL,
    has_compliance_opposition_from BOOLEAN NOT NULL,
    has_compliance_opposition_to BOOLEAN NOT NULL,
    has_logging_opt_in_from BOOLEAN NOT NULL,
    has_logging_opt_in_to BOOLEAN NOT NULL,
    CONSTRAINT fk_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_requested_for
        FOREIGN KEY (requested_for)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_study_id
        FOREIGN KEY (study_id)
        REFERENCES studies(name)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE OR REPLACE FUNCTION check_username_exists(check_username text)
    RETURNS boolean
AS
$$
BEGIN
    RETURN (SELECT EXISTS(SELECT 1 FROM users WHERE UPPER(username) = UPPER(check_username)));
END
$$ LANGUAGE plpgsql;

CREATE TABLE planned_probands
(
    user_id      TEXT PRIMARY KEY,
    password     TEXT      NOT NULL,
    activated_at TIMESTAMP NULL,
    CONSTRAINT username_not_yet_existing CHECK ( NOT check_username_exists(user_id) )
);
CREATE UNIQUE INDEX IF NOT EXISTS planned_probands_unique_user_id ON planned_probands (UPPER(user_id));

CREATE TABLE study_users (
    study_id TEXT,
    user_id TEXT,
    access_level TEXT NOT NULL,
    PRIMARY KEY (study_id, user_id),
    CONSTRAINT fk_study_id
        FOREIGN KEY (study_id)
        REFERENCES studies(name)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE study_planned_probands (
    study_id TEXT,
    user_id TEXT,
    PRIMARY KEY (study_id, user_id),
    CONSTRAINT fk_study_id
        FOREIGN KEY (study_id)
        REFERENCES studies(name)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES planned_probands(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE questionnaire_instances (
    id SERIAL PRIMARY KEY,
    study_id TEXT,
    questionnaire_id SERIAL,
    questionnaire_name TEXT NOT NULL,
    user_id TEXT,
    date_of_issue TIMESTAMP NOT NULL,
    date_of_release_v1 TIMESTAMP NULL,
    date_of_release_v2 TIMESTAMP NULL,
    cycle INT NOT NULL,
    status TEXT NOT NULL,
    notifications_scheduled BOOLEAN DEFAULT false,
    progress INT DEFAULT 0,
    release_version INT DEFAULT 0,
    questionnaire_version integer NOT NULL DEFAULT 1,
    transmission_ts_v1 TIMESTAMP NULL DEFAULT NULL,
    transmission_ts_v2 TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_study_id
        FOREIGN KEY (study_id)
        REFERENCES studies(name)
        ON DELETE CASCADE,
    CONSTRAINT fk_questionnaire_id
        FOREIGN KEY (questionnaire_id, questionnaire_version)
        REFERENCES questionnaires(id, version)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE questionnaire_instances_queued (
    user_id TEXT,
    questionnaire_instance_id SERIAL,
    date_of_queue TIMESTAMP NOT NULL,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_questionnaire_instance_id
        FOREIGN KEY (questionnaire_instance_id)
        REFERENCES questionnaire_instances(id)
        ON DELETE CASCADE
);

CREATE TABLE notification_schedules (
    id SERIAL PRIMARY KEY,
    user_id TEXT NULL,
    send_on TIMESTAMP NULL,
    notification_type TEXT NOT NULL,
    reference_id TEXT NULL,
    title TEXT NULL,
    body TEXT NULL,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE answers (
    questionnaire_instance_id SERIAL,
    question_id SERIAL,
    answer_option_id SERIAL,
    versioning INT DEFAULT 1,
    value TEXT NOT NULL,
    date_of_release TIMESTAMP NULL,
    releasing_person TEXT NULL,
    PRIMARY KEY (questionnaire_instance_id, question_id, answer_option_id, versioning),
    CONSTRAINT fk_questionnaire_instance_id
        FOREIGN KEY (questionnaire_instance_id)
        REFERENCES questionnaire_instances(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_question_id
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_answer_option_id
        FOREIGN KEY (answer_option_id)
        REFERENCES answer_options(id)
        ON DELETE CASCADE
);

CREATE TABLE lab_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NULL,
    order_id INT,
    date_of_sampling TIMESTAMP,
    status TEXT,
    remark TEXT,
    new_samples_sent BOOLEAN,
    performing_doctor TEXT,
    dummy_sample_id TEXT NULL,
    study_status TEXT DEFAULT 'active',
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CHECK (UPPER(id) = id AND UPPER(dummy_sample_id) = dummy_sample_id)
);

CREATE TABLE blood_samples (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    sample_id TEXT,
    blood_sample_carried_out BOOLEAN,
    remark TEXT,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE lab_observations (
    id SERIAL PRIMARY KEY,
    lab_result_id TEXT,
    name_id INT NOT NULL,
    name TEXT,
    result_value TEXT,
    comment TEXT,
    date_of_analysis TIMESTAMP,
    date_of_delivery TIMESTAMP,
    date_of_announcement TIMESTAMP,
    lab_name TEXT,
    material TEXT,
    result_string TEXT,
    unit TEXT,
    other_unit TEXT,
    kit_name TEXT,
    CONSTRAINT fk_lab_result_id
        FOREIGN KEY (lab_result_id)
        REFERENCES lab_results(id)
        ON DELETE CASCADE,
    UNIQUE (lab_result_id, name, date_of_analysis, lab_name)
);

CREATE TABLE user_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    app TEXT NOT NULL,
    activity_timestamp TIMESTAMP NOT NULL,
    activity jsonb
);
CREATE INDEX user_logs_user_id ON user_logs(user_id);

CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    requested_by TEXT NOT NULL,
    requested_for TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    type TEXT NOT NULL
);

CREATE TABLE user_files (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    questionnaire_instance_id SERIAL,
    answer_option_id SERIAL,
    file TEXT NOT NULL,
    file_name TEXT NULL,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_questionnaire_instance_id
        FOREIGN KEY (questionnaire_instance_id)
        REFERENCES questionnaire_instances(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_answer_option_id
        FOREIGN KEY (answer_option_id)
        REFERENCES answer_options(id)
        ON DELETE CASCADE
);

CREATE TABLE allowed_ips (
    ip TEXT PRIMARY KEY,
    allowed_role TEXT NOT NULL
);

CREATE TABLE testing_status (
    is_testing BOOLEAN DEFAULT false
);

INSERT INTO testing_status VALUES(false);

INSERT INTO answer_types(type) VALUES ('array_single');
INSERT INTO answer_types(type) VALUES ('array_multi');
INSERT INTO answer_types(type) VALUES ('number');
INSERT INTO answer_types(type) VALUES ('string');
INSERT INTO answer_types(type) VALUES ('date');
INSERT INTO answer_types(type) VALUES ('sample');
INSERT INTO answer_types(type) VALUES ('pzn');
INSERT INTO answer_types(type) VALUES ('image');
INSERT INTO answer_types(id, type) VALUES (9, 'date_time');
INSERT INTO answer_types(id, type) VALUES (10, 'file');

CREATE OR REPLACE FUNCTION table_update_notify() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify('table_update', json_build_object('table', TG_TABLE_NAME, 'row_old', row_to_json(OLD), 'row_new', row_to_json(NEW))::text);
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('table_insert', json_build_object('table', TG_TABLE_NAME, 'row', row_to_json(NEW))::text);
        RETURN NEW;
    ELSE
        PERFORM pg_notify('table_delete', json_build_object('table', TG_TABLE_NAME, 'row', row_to_json(OLD))::text);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_notify_update AFTER UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER users_notify_delete AFTER DELETE ON users FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER questionnaires_notify_insert AFTER INSERT ON questionnaires FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER questionnaires_notify_delete AFTER DELETE ON questionnaires FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER questionnaires_notify_update AFTER UPDATE ON questionnaires FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER answers_notify_insert AFTER INSERT ON answers FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER answers_notify_update AFTER UPDATE ON answers FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER answers_notify_delete AFTER DELETE ON answers FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER questionnaire_instances_notify_update AFTER UPDATE ON questionnaire_instances FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER lab_results_notify_update AFTER UPDATE ON lab_results FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER study_users_notify_insert AFTER INSERT ON study_users FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER study_users_notify_delete AFTER DELETE ON study_users FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

CREATE TRIGGER testing_status_notify_update AFTER UPDATE ON testing_status FOR EACH ROW EXECUTE PROCEDURE table_update_notify();

-- temporary triggers for resetting questionnaire instances

CREATE OR REPLACE FUNCTION answers_update_reset() RETURNS trigger AS $$
BEGIN

    IF NEW.value = 'reset' THEN
        DELETE FROM answers WHERE questionnaire_instance_id=NEW.questionnaire_instance_id;
        UPDATE questionnaire_instances SET status='active' WHERE id=NEW.questionnaire_instance_id;
    END IF;
    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_on_update_answer AFTER UPDATE ON answers FOR EACH ROW EXECUTE PROCEDURE answers_update_reset();
CREATE TRIGGER reset_on_insert_answer AFTER INSERT ON answers FOR EACH ROW EXECUTE PROCEDURE answers_update_reset();


-- auto increment SERIAL id fields when no id is given

CREATE OR REPLACE FUNCTION questionnaires_id_default(OUT nextfree bigint) AS
$func$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('questionnaires_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM questionnaires WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$func$  LANGUAGE plpgsql;


ALTER TABLE questionnaires ALTER COLUMN id SET DEFAULT questionnaires_id_default();


CREATE OR REPLACE FUNCTION questions_id_default(OUT nextfree bigint) AS
$func$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('questions_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM questions WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$func$  LANGUAGE plpgsql;

ALTER TABLE questions ALTER COLUMN id SET DEFAULT questions_id_default();


CREATE OR REPLACE FUNCTION answer_options_id_default(OUT nextfree bigint) AS
$func$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('answer_options_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM answer_options WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$func$  LANGUAGE plpgsql;

ALTER TABLE answer_options ALTER COLUMN id SET DEFAULT answer_options_id_default();

CREATE OR REPLACE FUNCTION lab_observations_id_default(OUT nextfree bigint) AS
$func$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('lab_observations_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM lab_observations WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$func$  LANGUAGE plpgsql;

ALTER TABLE lab_observations ALTER COLUMN id SET DEFAULT lab_observations_id_default();

CREATE OR REPLACE FUNCTION pending_deletions_id_default(OUT nextfree bigint) AS
$func$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('pending_deletions_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM pending_deletions WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$func$  LANGUAGE plpgsql;

ALTER TABLE pending_deletions ALTER COLUMN id SET DEFAULT pending_deletions_id_default();

CREATE OR REPLACE FUNCTION pending_partial_deletions_id_default(OUT nextfree bigint) AS
$func$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('pending_partial_deletions_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM pending_partial_deletions WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$func$  LANGUAGE plpgsql;

ALTER TABLE pending_partial_deletions ALTER COLUMN id SET DEFAULT pending_partial_deletions_id_default();


-- trigger for setting is_condition_target when condition changes

CREATE OR REPLACE FUNCTION mark_condition_target() RETURNS trigger AS $$
BEGIN

    IF TG_OP = 'UPDATE' THEN
        UPDATE answer_options SET is_condition_target=false WHERE id=OLD.condition_target_answer_option;
        UPDATE answer_options SET is_condition_target=true WHERE id=NEW.condition_target_answer_option;
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        UPDATE answer_options SET is_condition_target=true WHERE id=NEW.condition_target_answer_option;
        RETURN NEW;
    ELSE
        UPDATE answer_options SET is_condition_target=false WHERE id=OLD.condition_target_answer_option;
        RETURN OLD;
    END IF;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_condition_target_on_update AFTER UPDATE ON conditions FOR EACH ROW EXECUTE PROCEDURE mark_condition_target();
CREATE TRIGGER mark_condition_target_on_insert AFTER INSERT ON conditions FOR EACH ROW EXECUTE PROCEDURE mark_condition_target();
CREATE TRIGGER mark_condition_target_on_delete AFTER DELETE ON conditions FOR EACH ROW EXECUTE PROCEDURE mark_condition_target();

-- automatically save update date in updated_at column

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at_column_on_insert BEFORE INSERT ON questionnaires FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_updated_at_column_on_update BEFORE UPDATE ON questionnaires FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
