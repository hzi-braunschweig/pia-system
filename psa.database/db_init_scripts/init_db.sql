/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

--
-- PostgreSQL database dump
--
-- This dump was created at 2021-11-23. It is based on the develop branch
-- and represents the database schema including all migrations until that
-- day. It may be used to spin up a fresh pia database, e.g. for testing.
--

-- Custom extension: create expected roles
CREATE ROLE loggingservice_role;
CREATE ROLE sormasservice_role;

-- Dumped from database version 10.19 (Debian 10.19-1.pgdg90+1)
-- Dumped by pg_dump version 12.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: loggingservice; Type: SCHEMA; Schema: -
--

CREATE SCHEMA loggingservice;

--
-- Name: sormasservice; Type: SCHEMA; Schema: -
--

CREATE SCHEMA sormasservice;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: account_status_type; Type: TYPE; Schema: public
--

CREATE TYPE public.account_status_type AS ENUM (
    'account',
    'no_account'
);

--
-- Name: proband_status_type; Type: TYPE; Schema: public
--

CREATE TYPE public.proband_status_type AS ENUM (
    'active',
    'deactivated',
    'deleted'
);

--
-- Name: type_publish; Type: TYPE; Schema: public
--

CREATE TYPE public.type_publish AS ENUM (
    'hidden',
    'testprobands',
    'allaudiences'
);

--
-- Name: answer_options_id_default(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.answer_options_id_default(OUT nextfree bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('answer_options_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM answer_options WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$$;

--
-- Name: check_pseudonym_exists(text); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.check_pseudonym_exists(check_pseudonym text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (SELECT EXISTS(SELECT 1 FROM probands WHERE UPPER(pseudonym) = UPPER(check_pseudonym)));
END
$$;

--
-- Name: lab_observations_id_default(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.lab_observations_id_default(OUT nextfree bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('lab_observations_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM lab_observations WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$$;

--
-- Name: mark_condition_target(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.mark_condition_target() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;

--
-- Name: pending_deletions_id_default(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.pending_deletions_id_default(OUT nextfree bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('pending_deletions_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM pending_deletions WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$$;

--
-- Name: pending_partial_deletions_id_default(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.pending_partial_deletions_id_default(OUT nextfree bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('pending_partial_deletions_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM pending_partial_deletions WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$$;

--
-- Name: questionnaires_id_default(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.questionnaires_id_default(OUT nextfree bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('questionnaires_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM questionnaires WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$$;

--
-- Name: questions_id_default(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.questions_id_default(OUT nextfree bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
LOOP
   SELECT INTO nextfree  val
   FROM   nextval('questions_id_seq'::regclass) val
   WHERE  NOT EXISTS (SELECT 1 FROM questions WHERE id = val);

   EXIT WHEN FOUND;
END LOOP;
END
$$;

--
-- Name: table_update_notify(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.table_update_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

SET default_tablespace = '';

--
-- Name: system_logs; Type: TABLE; Schema: loggingservice; Owner: loggingservice_role
--

CREATE TABLE loggingservice.system_logs (
    id integer NOT NULL,
    requested_by text NOT NULL,
    requested_for text NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    type text NOT NULL
);


ALTER TABLE loggingservice.system_logs OWNER TO loggingservice_role;

--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: loggingservice; Owner: loggingservice_role
--

CREATE SEQUENCE loggingservice.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE loggingservice.system_logs_id_seq OWNER TO loggingservice_role;

--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: loggingservice; Owner: loggingservice_role
--

ALTER SEQUENCE loggingservice.system_logs_id_seq OWNED BY loggingservice.system_logs.id;


--
-- Name: accounts; Type: TABLE; Schema: public
--

CREATE TABLE public.accounts (
    username text NOT NULL,
    password text NOT NULL,
    salt text,
    role text NOT NULL,
    pw_change_needed boolean DEFAULT true,
    number_of_wrong_attempts integer,
    third_wrong_password_at timestamp without time zone,
    initial_password_validity_date timestamp without time zone
);

--
-- Name: allowed_ips; Type: TABLE; Schema: public
--

CREATE TABLE public.allowed_ips (
    ip text NOT NULL,
    allowed_role text NOT NULL
);

--
-- Name: answer_options; Type: TABLE; Schema: public
--

CREATE TABLE public.answer_options (
    id integer DEFAULT public.answer_options_id_default() NOT NULL,
    question_id integer NOT NULL,
    text text,
    answer_type_id integer NOT NULL,
    is_notable boolean[] DEFAULT '{}'::boolean[],
    "values" text[],
    values_code integer[],
    "position" integer NOT NULL,
    is_condition_target boolean DEFAULT false,
    restriction_min numeric,
    restriction_max numeric,
    is_decimal boolean,
    label text DEFAULT ''::text
);

--
-- Name: answer_options_answer_type_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answer_options_answer_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answer_options_answer_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answer_options_answer_type_id_seq OWNED BY public.answer_options.answer_type_id;


--
-- Name: answer_options_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answer_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answer_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answer_options_id_seq OWNED BY public.answer_options.id;


--
-- Name: answer_options_question_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answer_options_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answer_options_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answer_options_question_id_seq OWNED BY public.answer_options.question_id;


--
-- Name: answer_types; Type: TABLE; Schema: public
--

CREATE TABLE public.answer_types (
    id integer NOT NULL,
    type text
);

--
-- Name: answer_types_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answer_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answer_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answer_types_id_seq OWNED BY public.answer_types.id;


--
-- Name: answers; Type: TABLE; Schema: public
--

CREATE TABLE public.answers (
    questionnaire_instance_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_option_id integer NOT NULL,
    versioning integer DEFAULT 1 NOT NULL,
    value text NOT NULL,
    date_of_release timestamp without time zone,
    releasing_person text
);

--
-- Name: answers_answer_option_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answers_answer_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answers_answer_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answers_answer_option_id_seq OWNED BY public.answers.answer_option_id;


--
-- Name: answers_question_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answers_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answers_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answers_question_id_seq OWNED BY public.answers.question_id;


--
-- Name: answers_questionnaire_instance_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.answers_questionnaire_instance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: answers_questionnaire_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.answers_questionnaire_instance_id_seq OWNED BY public.answers.questionnaire_instance_id;


--
-- Name: blood_samples; Type: TABLE; Schema: public
--

CREATE TABLE public.blood_samples (
    id integer NOT NULL,
    user_id text,
    sample_id text,
    blood_sample_carried_out boolean,
    remark text
);

--
-- Name: blood_samples_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.blood_samples_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: blood_samples_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.blood_samples_id_seq OWNED BY public.blood_samples.id;


--
-- Name: conditions; Type: TABLE; Schema: public
--

CREATE TABLE public.conditions (
    condition_type text,
    condition_answer_option_id integer,
    condition_question_id integer,
    condition_questionnaire_id integer,
    condition_operand text,
    condition_value text,
    condition_target_answer_option integer,
    condition_target_questionnaire integer,
    id integer NOT NULL,
    condition_link text,
    condition_questionnaire_version integer DEFAULT 1 NOT NULL,
    condition_target_questionnaire_version integer DEFAULT 1
);

--
-- Name: conditions_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.conditions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: conditions_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.conditions_id_seq OWNED BY public.conditions.id;


--
-- Name: db_migrations; Type: TABLE; Schema: public
--

CREATE TABLE public.db_migrations (
    name text NOT NULL,
    date timestamp with time zone NOT NULL
);

--
-- Name: fcm_tokens; Type: TABLE; Schema: public
--

CREATE TABLE public.fcm_tokens (
    id integer NOT NULL,
    token text NOT NULL,
    pseudonym text NOT NULL,
    study text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: fcm_tokens_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.fcm_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: fcm_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.fcm_tokens_id_seq OWNED BY public.fcm_tokens.id;


--
-- Name: lab_observations; Type: TABLE; Schema: public
--

CREATE TABLE public.lab_observations (
    id integer DEFAULT public.lab_observations_id_default() NOT NULL,
    lab_result_id text,
    name_id integer NOT NULL,
    name text,
    result_value text,
    comment text,
    date_of_analysis timestamp without time zone,
    date_of_delivery timestamp without time zone,
    date_of_announcement timestamp without time zone,
    lab_name text,
    material text,
    result_string text,
    unit text,
    other_unit text,
    kit_name text
);

--
-- Name: lab_observations_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.lab_observations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: lab_observations_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.lab_observations_id_seq OWNED BY public.lab_observations.id;


--
-- Name: lab_results; Type: TABLE; Schema: public
--

CREATE TABLE public.lab_results (
    id text NOT NULL,
    user_id text,
    order_id integer,
    date_of_sampling timestamp without time zone,
    status text,
    remark text,
    new_samples_sent boolean,
    performing_doctor text,
    dummy_sample_id text,
    study_status text DEFAULT 'active'::text,
    CONSTRAINT lab_results_check CHECK (((upper(id) = id) AND (upper(dummy_sample_id) = dummy_sample_id))),
    CONSTRAINT upper_case_check CHECK (((upper(id) = id) AND (upper(dummy_sample_id) = dummy_sample_id)))
);

--
-- Name: notification_schedules; Type: TABLE; Schema: public
--

CREATE TABLE public.notification_schedules (
    id integer NOT NULL,
    user_id text,
    send_on timestamp without time zone,
    notification_type text NOT NULL,
    reference_id text,
    title text,
    body text
);

--
-- Name: notification_schedules_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.notification_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: notification_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.notification_schedules_id_seq OWNED BY public.notification_schedules.id;


--
-- Name: pending_compliance_changes; Type: TABLE; Schema: public
--

CREATE TABLE public.pending_compliance_changes (
    id integer NOT NULL,
    requested_by text NOT NULL,
    requested_for text NOT NULL,
    proband_id text NOT NULL,
    compliance_labresults_from boolean NOT NULL,
    compliance_labresults_to boolean NOT NULL,
    compliance_samples_from boolean NOT NULL,
    compliance_samples_to boolean NOT NULL,
    compliance_bloodsamples_from boolean NOT NULL,
    compliance_bloodsamples_to boolean NOT NULL
);

--
-- Name: pending_compliance_changes_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.pending_compliance_changes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: pending_compliance_changes_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.pending_compliance_changes_id_seq OWNED BY public.pending_compliance_changes.id;


--
-- Name: pending_deletions; Type: TABLE; Schema: public
--

CREATE TABLE public.pending_deletions (
    id integer DEFAULT public.pending_deletions_id_default() NOT NULL,
    requested_by text NOT NULL,
    requested_for text NOT NULL,
    type text NOT NULL,
    for_id text NOT NULL
);

--
-- Name: pending_deletions_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.pending_deletions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: pending_deletions_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.pending_deletions_id_seq OWNED BY public.pending_deletions.id;


--
-- Name: pending_partial_deletions; Type: TABLE; Schema: public
--

CREATE TABLE public.pending_partial_deletions (
    id integer DEFAULT public.pending_partial_deletions_id_default() NOT NULL,
    requested_by text NOT NULL,
    requested_for text NOT NULL,
    proband_id text NOT NULL,
    from_date timestamp without time zone,
    to_date timestamp without time zone,
    for_instance_ids integer[],
    for_lab_results_ids text[]
);

--
-- Name: pending_partial_deletions_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.pending_partial_deletions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: pending_partial_deletions_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.pending_partial_deletions_id_seq OWNED BY public.pending_partial_deletions.id;


--
-- Name: pending_study_changes; Type: TABLE; Schema: public
--

CREATE TABLE public.pending_study_changes (
    id integer NOT NULL,
    requested_by text NOT NULL,
    requested_for text NOT NULL,
    study_id text NOT NULL,
    description_from text,
    description_to text,
    has_rna_samples_from boolean NOT NULL,
    has_rna_samples_to boolean NOT NULL,
    sample_prefix_from text,
    sample_prefix_to text,
    sample_suffix_length_from integer,
    sample_suffix_length_to integer,
    pseudonym_prefix_from text,
    pseudonym_prefix_to text,
    pseudonym_suffix_length_from integer,
    pseudonym_suffix_length_to integer,
    has_answers_notify_feature_from boolean NOT NULL,
    has_answers_notify_feature_to boolean NOT NULL,
    has_answers_notify_feature_by_mail_from boolean NOT NULL,
    has_answers_notify_feature_by_mail_to boolean NOT NULL,
    has_four_eyes_opposition_from boolean NOT NULL,
    has_four_eyes_opposition_to boolean NOT NULL,
    has_partial_opposition_from boolean NOT NULL,
    has_partial_opposition_to boolean NOT NULL,
    has_total_opposition_from boolean NOT NULL,
    has_total_opposition_to boolean NOT NULL,
    has_compliance_opposition_from boolean NOT NULL,
    has_compliance_opposition_to boolean NOT NULL,
    has_logging_opt_in_from boolean NOT NULL,
    has_logging_opt_in_to boolean NOT NULL
);

--
-- Name: pending_study_changes_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.pending_study_changes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: pending_study_changes_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.pending_study_changes_id_seq OWNED BY public.pending_study_changes.id;


--
-- Name: planned_probands; Type: TABLE; Schema: public
--

CREATE TABLE public.planned_probands (
    user_id text NOT NULL,
    password text NOT NULL,
    activated_at timestamp without time zone,
    CONSTRAINT pseudonym_not_yet_existing CHECK ((NOT public.check_pseudonym_exists(user_id)))
);

--
-- Name: probands; Type: TABLE; Schema: public
--

CREATE TABLE public.probands (
    pseudonym text NOT NULL,
    ids text,
    mapping_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    study text NOT NULL,
    status public.proband_status_type DEFAULT 'active'::public.proband_status_type NOT NULL,
    study_center text,
    examination_wave integer DEFAULT 1,
    compliance_labresults boolean DEFAULT true NOT NULL,
    compliance_samples boolean DEFAULT true NOT NULL,
    compliance_bloodsamples boolean DEFAULT true NOT NULL,
    compliance_contact boolean DEFAULT false NOT NULL,
    logging_active boolean DEFAULT true,
    needs_material boolean DEFAULT false,
    is_test_proband boolean DEFAULT false,
    first_logged_in_at date
);

--
-- Name: questionnaire_instances; Type: TABLE; Schema: public
--

CREATE TABLE public.questionnaire_instances (
    id integer NOT NULL,
    study_id text,
    questionnaire_id integer NOT NULL,
    questionnaire_name text NOT NULL,
    user_id text,
    date_of_issue timestamp without time zone NOT NULL,
    date_of_release_v1 timestamp without time zone,
    date_of_release_v2 timestamp without time zone,
    cycle integer NOT NULL,
    status text NOT NULL,
    notifications_scheduled boolean DEFAULT false,
    progress integer DEFAULT 0,
    release_version integer DEFAULT 0,
    questionnaire_version integer DEFAULT 1 NOT NULL,
    transmission_ts_v1 timestamp without time zone,
    transmission_ts_v2 timestamp without time zone
);

--
-- Name: questionnaire_instances_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.questionnaire_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questionnaire_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.questionnaire_instances_id_seq OWNED BY public.questionnaire_instances.id;


--
-- Name: questionnaire_instances_questionnaire_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.questionnaire_instances_questionnaire_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questionnaire_instances_questionnaire_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.questionnaire_instances_questionnaire_id_seq OWNED BY public.questionnaire_instances.questionnaire_id;


--
-- Name: questionnaire_instances_queued; Type: TABLE; Schema: public
--

CREATE TABLE public.questionnaire_instances_queued (
    user_id text,
    questionnaire_instance_id integer NOT NULL,
    date_of_queue timestamp without time zone NOT NULL
);

--
-- Name: questionnaire_instances_queued_questionnaire_instance_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.questionnaire_instances_queued_questionnaire_instance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questionnaire_instances_queued_questionnaire_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.questionnaire_instances_queued_questionnaire_instance_id_seq OWNED BY public.questionnaire_instances_queued.questionnaire_instance_id;


--
-- Name: questionnaires; Type: TABLE; Schema: public
--

CREATE TABLE public.questionnaires (
    id integer DEFAULT public.questionnaires_id_default() NOT NULL,
    study_id text,
    name text NOT NULL,
    no_questions integer NOT NULL,
    cycle_amount integer,
    cycle_unit text,
    activate_after_days integer NOT NULL,
    deactivate_after_days integer NOT NULL,
    notification_tries integer NOT NULL,
    notification_title text NOT NULL,
    notification_body_new text NOT NULL,
    notification_body_in_progress text NOT NULL,
    notification_weekday text,
    notification_interval integer,
    notification_interval_unit text,
    activate_at_date date,
    compliance_needed boolean DEFAULT false,
    expires_after_days integer DEFAULT 5 NOT NULL,
    finalises_after_days integer DEFAULT 2 NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    type text DEFAULT 'for_probands'::text,
    version integer DEFAULT 1 NOT NULL,
    publish public.type_publish DEFAULT 'allaudiences'::public.type_publish,
    notify_when_not_filled boolean DEFAULT false,
    notify_when_not_filled_time text,
    notify_when_not_filled_day integer,
    cycle_per_day integer,
    cycle_first_hour integer,
    keep_answers boolean DEFAULT false,
    active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone
);

--
-- Name: questionnaires_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.questionnaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questionnaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.questionnaires_id_seq OWNED BY public.questionnaires.id;


--
-- Name: questions; Type: TABLE; Schema: public
--

CREATE TABLE public.questions (
    id integer DEFAULT public.questions_id_default() NOT NULL,
    questionnaire_id integer NOT NULL,
    text text NOT NULL,
    "position" integer NOT NULL,
    is_mandatory boolean,
    label text DEFAULT ''::text,
    questionnaire_version integer DEFAULT 1 NOT NULL
);

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: questions_questionnaire_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.questions_questionnaire_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questions_questionnaire_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.questions_questionnaire_id_seq OWNED BY public.questions.questionnaire_id;


--
-- Name: studies; Type: TABLE; Schema: public
--

CREATE TABLE public.studies (
    name text NOT NULL,
    description text,
    pm_email text,
    hub_email text,
    status text DEFAULT 'active'::text,
    address text,
    has_rna_samples boolean DEFAULT true,
    sample_prefix text DEFAULT 'ZIFCO'::text,
    sample_suffix_length integer DEFAULT 10,
    pseudonym_prefix text DEFAULT 'PIA'::text,
    pseudonym_suffix_length integer DEFAULT 8,
    has_answers_notify_feature boolean DEFAULT false,
    has_answers_notify_feature_by_mail boolean DEFAULT false,
    has_four_eyes_opposition boolean DEFAULT true,
    has_partial_opposition boolean DEFAULT true,
    has_total_opposition boolean DEFAULT true,
    has_compliance_opposition boolean DEFAULT true,
    has_logging_opt_in boolean DEFAULT false
);

--
-- Name: study_planned_probands; Type: TABLE; Schema: public
--

CREATE TABLE public.study_planned_probands (
    study_id text NOT NULL,
    user_id text NOT NULL
);

--
-- Name: study_users; Type: TABLE; Schema: public
--

CREATE TABLE public.study_users (
    study_id text NOT NULL,
    user_id text NOT NULL,
    access_level text NOT NULL
);

--
-- Name: study_welcome_text; Type: TABLE; Schema: public
--

CREATE TABLE public.study_welcome_text (
    study_id text NOT NULL,
    welcome_text text,
    language text DEFAULT 'de_DE'::text NOT NULL
);

--
-- Name: user_files; Type: TABLE; Schema: public
--

CREATE TABLE public.user_files (
    id integer NOT NULL,
    user_id text NOT NULL,
    questionnaire_instance_id integer NOT NULL,
    answer_option_id integer NOT NULL,
    file text NOT NULL,
    file_name text
);

--
-- Name: user_files_answer_option_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.user_files_answer_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_files_answer_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.user_files_answer_option_id_seq OWNED BY public.user_files.answer_option_id;


--
-- Name: user_files_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.user_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.user_files_id_seq OWNED BY public.user_files.id;


--
-- Name: user_files_questionnaire_instance_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.user_files_questionnaire_instance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_files_questionnaire_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.user_files_questionnaire_instance_id_seq OWNED BY public.user_files.questionnaire_instance_id;


--
-- Name: users_to_contact; Type: TABLE; Schema: public
--

CREATE TABLE public.users_to_contact (
    id integer NOT NULL,
    user_id text NOT NULL,
    notable_answer_questionnaire_instances integer[] DEFAULT '{}'::integer[],
    is_notable_answer boolean,
    is_notable_answer_at timestamp without time zone,
    not_filledout_questionnaire_instances integer[] DEFAULT '{}'::integer[],
    is_not_filledout boolean,
    is_not_filledout_at timestamp without time zone,
    processed boolean DEFAULT false NOT NULL,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: users_to_contact_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE public.users_to_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: users_to_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE public.users_to_contact_id_seq OWNED BY public.users_to_contact.id;


--
-- Name: system_logs id; Type: DEFAULT; Schema: loggingservice; Owner: loggingservice_role
--

ALTER TABLE ONLY loggingservice.system_logs ALTER COLUMN id SET DEFAULT nextval('loggingservice.system_logs_id_seq'::regclass);


--
-- Name: answer_options question_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.answer_options ALTER COLUMN question_id SET DEFAULT nextval('public.answer_options_question_id_seq'::regclass);


--
-- Name: answer_options answer_type_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.answer_options ALTER COLUMN answer_type_id SET DEFAULT nextval('public.answer_options_answer_type_id_seq'::regclass);


--
-- Name: answer_types id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.answer_types ALTER COLUMN id SET DEFAULT nextval('public.answer_types_id_seq'::regclass);


--
-- Name: answers questionnaire_instance_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.answers ALTER COLUMN questionnaire_instance_id SET DEFAULT nextval('public.answers_questionnaire_instance_id_seq'::regclass);


--
-- Name: answers question_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.answers ALTER COLUMN question_id SET DEFAULT nextval('public.answers_question_id_seq'::regclass);


--
-- Name: answers answer_option_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.answers ALTER COLUMN answer_option_id SET DEFAULT nextval('public.answers_answer_option_id_seq'::regclass);


--
-- Name: blood_samples id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.blood_samples ALTER COLUMN id SET DEFAULT nextval('public.blood_samples_id_seq'::regclass);


--
-- Name: conditions id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.conditions ALTER COLUMN id SET DEFAULT nextval('public.conditions_id_seq'::regclass);


--
-- Name: fcm_tokens id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.fcm_tokens ALTER COLUMN id SET DEFAULT nextval('public.fcm_tokens_id_seq'::regclass);


--
-- Name: notification_schedules id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.notification_schedules ALTER COLUMN id SET DEFAULT nextval('public.notification_schedules_id_seq'::regclass);


--
-- Name: pending_compliance_changes id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.pending_compliance_changes ALTER COLUMN id SET DEFAULT nextval('public.pending_compliance_changes_id_seq'::regclass);


--
-- Name: pending_study_changes id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.pending_study_changes ALTER COLUMN id SET DEFAULT nextval('public.pending_study_changes_id_seq'::regclass);


--
-- Name: questionnaire_instances id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances ALTER COLUMN id SET DEFAULT nextval('public.questionnaire_instances_id_seq'::regclass);


--
-- Name: questionnaire_instances questionnaire_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances ALTER COLUMN questionnaire_id SET DEFAULT nextval('public.questionnaire_instances_questionnaire_id_seq'::regclass);


--
-- Name: questionnaire_instances_queued questionnaire_instance_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances_queued ALTER COLUMN questionnaire_instance_id SET DEFAULT nextval('public.questionnaire_instances_queued_questionnaire_instance_id_seq'::regclass);


--
-- Name: questions questionnaire_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.questions ALTER COLUMN questionnaire_id SET DEFAULT nextval('public.questions_questionnaire_id_seq'::regclass);


--
-- Name: user_files id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.user_files ALTER COLUMN id SET DEFAULT nextval('public.user_files_id_seq'::regclass);


--
-- Name: user_files questionnaire_instance_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.user_files ALTER COLUMN questionnaire_instance_id SET DEFAULT nextval('public.user_files_questionnaire_instance_id_seq'::regclass);


--
-- Name: user_files answer_option_id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.user_files ALTER COLUMN answer_option_id SET DEFAULT nextval('public.user_files_answer_option_id_seq'::regclass);


--
-- Name: users_to_contact id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY public.users_to_contact ALTER COLUMN id SET DEFAULT nextval('public.users_to_contact_id_seq'::regclass);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: loggingservice; Owner: loggingservice_role
--

ALTER TABLE ONLY loggingservice.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (username);


--
-- Name: allowed_ips allowed_ips_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.allowed_ips
    ADD CONSTRAINT allowed_ips_pkey PRIMARY KEY (ip);


--
-- Name: answer_options answer_options_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answer_options
    ADD CONSTRAINT answer_options_pkey PRIMARY KEY (id);


--
-- Name: answer_types answer_types_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answer_types
    ADD CONSTRAINT answer_types_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (questionnaire_instance_id, question_id, answer_option_id, versioning);


--
-- Name: blood_samples blood_samples_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.blood_samples
    ADD CONSTRAINT blood_samples_pkey PRIMARY KEY (id);


--
-- Name: conditions conditions_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT conditions_pkey PRIMARY KEY (id);


--
-- Name: db_migrations db_migrations_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.db_migrations
    ADD CONSTRAINT db_migrations_pkey PRIMARY KEY (name);


--
-- Name: fcm_tokens fcm_tokens_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_pkey PRIMARY KEY (id);


--
-- Name: fcm_tokens fcm_tokens_token_pseudonym_study_key; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_token_pseudonym_study_key UNIQUE (token, pseudonym, study);


--
-- Name: lab_observations lab_observations_lab_result_id_name_date_of_analysis_lab_na_key; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.lab_observations
    ADD CONSTRAINT lab_observations_lab_result_id_name_date_of_analysis_lab_na_key UNIQUE (lab_result_id, name, date_of_analysis, lab_name);


--
-- Name: lab_observations lab_observations_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.lab_observations
    ADD CONSTRAINT lab_observations_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: notification_schedules notification_schedules_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.notification_schedules
    ADD CONSTRAINT notification_schedules_pkey PRIMARY KEY (id);


--
-- Name: pending_compliance_changes pending_compliance_changes_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_compliance_changes
    ADD CONSTRAINT pending_compliance_changes_pkey PRIMARY KEY (id);


--
-- Name: pending_deletions pending_deletions_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_deletions
    ADD CONSTRAINT pending_deletions_pkey PRIMARY KEY (id);


--
-- Name: pending_partial_deletions pending_partial_deletions_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_partial_deletions
    ADD CONSTRAINT pending_partial_deletions_pkey PRIMARY KEY (id);


--
-- Name: pending_study_changes pending_study_changes_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_study_changes
    ADD CONSTRAINT pending_study_changes_pkey PRIMARY KEY (id);


--
-- Name: planned_probands planned_probands_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.planned_probands
    ADD CONSTRAINT planned_probands_pkey PRIMARY KEY (user_id);


--
-- Name: probands probands_ids_key; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.probands
    ADD CONSTRAINT probands_ids_key UNIQUE (ids);


--
-- Name: probands probands_mapping_id_key; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.probands
    ADD CONSTRAINT probands_mapping_id_key UNIQUE (mapping_id);


--
-- Name: probands probands_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.probands
    ADD CONSTRAINT probands_pkey PRIMARY KEY (pseudonym);


--
-- Name: questionnaire_instances questionnaire_instances_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances
    ADD CONSTRAINT questionnaire_instances_pkey PRIMARY KEY (id);


--
-- Name: questionnaires questionnaires_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaires
    ADD CONSTRAINT questionnaires_pkey PRIMARY KEY (id, version);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: studies studies_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.studies
    ADD CONSTRAINT studies_pkey PRIMARY KEY (name);


--
-- Name: study_planned_probands study_planned_probands_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_planned_probands
    ADD CONSTRAINT study_planned_probands_pkey PRIMARY KEY (study_id, user_id);


--
-- Name: study_users study_users_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_users
    ADD CONSTRAINT study_users_pkey PRIMARY KEY (study_id, user_id);


--
-- Name: study_welcome_text study_welcome_text_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_welcome_text
    ADD CONSTRAINT study_welcome_text_pkey PRIMARY KEY (study_id, language);


--
-- Name: lab_observations unique_lab_observation; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.lab_observations
    ADD CONSTRAINT unique_lab_observation UNIQUE (lab_result_id, name, date_of_analysis, lab_name);


--
-- Name: user_files user_files_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.user_files
    ADD CONSTRAINT user_files_pkey PRIMARY KEY (id);


--
-- Name: users_to_contact users_to_contact_pkey; Type: CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.users_to_contact
    ADD CONSTRAINT users_to_contact_pkey PRIMARY KEY (id);


--
-- Name: accounts_unique_username; Type: INDEX; Schema: public
--

CREATE UNIQUE INDEX accounts_unique_username ON public.accounts USING btree (upper(username));


--
-- Name: planned_probands_unique_user_id; Type: INDEX; Schema: public
--

CREATE UNIQUE INDEX planned_probands_unique_user_id ON public.planned_probands USING btree (upper(user_id));


--
-- Name: lab_results lab_results_notify_update; Type: TRIGGER; Schema: public
--

CREATE TRIGGER lab_results_notify_update AFTER UPDATE ON public.lab_results FOR EACH ROW EXECUTE PROCEDURE public.table_update_notify();


--
-- Name: conditions mark_condition_target_on_delete; Type: TRIGGER; Schema: public
--

CREATE TRIGGER mark_condition_target_on_delete AFTER DELETE ON public.conditions FOR EACH ROW EXECUTE PROCEDURE public.mark_condition_target();


--
-- Name: conditions mark_condition_target_on_insert; Type: TRIGGER; Schema: public
--

CREATE TRIGGER mark_condition_target_on_insert AFTER INSERT ON public.conditions FOR EACH ROW EXECUTE PROCEDURE public.mark_condition_target();


--
-- Name: conditions mark_condition_target_on_update; Type: TRIGGER; Schema: public
--

CREATE TRIGGER mark_condition_target_on_update AFTER UPDATE ON public.conditions FOR EACH ROW EXECUTE PROCEDURE public.mark_condition_target();


--
-- Name: questionnaire_instances questionnaire_instances_notify_update; Type: TRIGGER; Schema: public
--

CREATE TRIGGER questionnaire_instances_notify_update AFTER UPDATE ON public.questionnaire_instances FOR EACH ROW EXECUTE PROCEDURE public.table_update_notify();


--
-- Name: questionnaires questionnaires_notify_insert; Type: TRIGGER; Schema: public
--

CREATE TRIGGER questionnaires_notify_insert AFTER INSERT ON public.questionnaires FOR EACH ROW EXECUTE PROCEDURE public.table_update_notify();


--
-- Name: questionnaires questionnaires_notify_update; Type: TRIGGER; Schema: public
--

CREATE TRIGGER questionnaires_notify_update AFTER UPDATE ON public.questionnaires FOR EACH ROW EXECUTE PROCEDURE public.table_update_notify();


--
-- Name: questionnaires update_updated_at_column_on_insert; Type: TRIGGER; Schema: public
--

CREATE TRIGGER update_updated_at_column_on_insert BEFORE INSERT ON public.questionnaires FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();


--
-- Name: questionnaires update_updated_at_column_on_update; Type: TRIGGER; Schema: public
--

CREATE TRIGGER update_updated_at_column_on_update BEFORE UPDATE ON public.questionnaires FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();


--
-- Name: answers fk_answer_option_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_answer_option_id FOREIGN KEY (answer_option_id) REFERENCES public.answer_options(id) ON DELETE CASCADE;


--
-- Name: user_files fk_answer_option_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.user_files
    ADD CONSTRAINT fk_answer_option_id FOREIGN KEY (answer_option_id) REFERENCES public.answer_options(id) ON DELETE CASCADE;


--
-- Name: answer_options fk_answer_type_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answer_options
    ADD CONSTRAINT fk_answer_type_id FOREIGN KEY (answer_type_id) REFERENCES public.answer_types(id) ON DELETE CASCADE;


--
-- Name: conditions fk_condition_answer_option; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT fk_condition_answer_option FOREIGN KEY (condition_answer_option_id) REFERENCES public.answer_options(id) ON DELETE CASCADE;


--
-- Name: conditions fk_condition_question; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT fk_condition_question FOREIGN KEY (condition_question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: conditions fk_condition_questionnaire; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT fk_condition_questionnaire FOREIGN KEY (condition_questionnaire_id, condition_questionnaire_version) REFERENCES public.questionnaires(id, version) ON DELETE CASCADE;


--
-- Name: conditions fk_condition_target_answer_option; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT fk_condition_target_answer_option FOREIGN KEY (condition_target_answer_option) REFERENCES public.answer_options(id) ON DELETE SET NULL;


--
-- Name: conditions fk_condition_target_questionnaire; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT fk_condition_target_questionnaire FOREIGN KEY (condition_target_questionnaire, condition_target_questionnaire_version) REFERENCES public.questionnaires(id, version) ON DELETE SET NULL;


--
-- Name: lab_observations fk_lab_result_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.lab_observations
    ADD CONSTRAINT fk_lab_result_id FOREIGN KEY (lab_result_id) REFERENCES public.lab_results(id) ON DELETE CASCADE;


--
-- Name: pending_partial_deletions fk_proband_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_partial_deletions
    ADD CONSTRAINT fk_proband_id FOREIGN KEY (proband_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_compliance_changes fk_proband_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_compliance_changes
    ADD CONSTRAINT fk_proband_id FOREIGN KEY (proband_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: answer_options fk_question_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answer_options
    ADD CONSTRAINT fk_question_id FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: answers fk_question_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_question_id FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: questions fk_questionnaire_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT fk_questionnaire_id FOREIGN KEY (questionnaire_id, questionnaire_version) REFERENCES public.questionnaires(id, version) ON DELETE CASCADE;


--
-- Name: questionnaire_instances fk_questionnaire_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances
    ADD CONSTRAINT fk_questionnaire_id FOREIGN KEY (questionnaire_id, questionnaire_version) REFERENCES public.questionnaires(id, version) ON DELETE CASCADE;


--
-- Name: questionnaire_instances_queued fk_questionnaire_instance_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances_queued
    ADD CONSTRAINT fk_questionnaire_instance_id FOREIGN KEY (questionnaire_instance_id) REFERENCES public.questionnaire_instances(id) ON DELETE CASCADE;


--
-- Name: answers fk_questionnaire_instance_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_questionnaire_instance_id FOREIGN KEY (questionnaire_instance_id) REFERENCES public.questionnaire_instances(id) ON DELETE CASCADE;


--
-- Name: user_files fk_questionnaire_instance_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.user_files
    ADD CONSTRAINT fk_questionnaire_instance_id FOREIGN KEY (questionnaire_instance_id) REFERENCES public.questionnaire_instances(id) ON DELETE CASCADE;


--
-- Name: pending_deletions fk_requested_by; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_deletions
    ADD CONSTRAINT fk_requested_by FOREIGN KEY (requested_by) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_partial_deletions fk_requested_by; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_partial_deletions
    ADD CONSTRAINT fk_requested_by FOREIGN KEY (requested_by) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_compliance_changes fk_requested_by; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_compliance_changes
    ADD CONSTRAINT fk_requested_by FOREIGN KEY (requested_by) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_study_changes fk_requested_by; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_study_changes
    ADD CONSTRAINT fk_requested_by FOREIGN KEY (requested_by) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_deletions fk_requested_for; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_deletions
    ADD CONSTRAINT fk_requested_for FOREIGN KEY (requested_for) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_partial_deletions fk_requested_for; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_partial_deletions
    ADD CONSTRAINT fk_requested_for FOREIGN KEY (requested_for) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_compliance_changes fk_requested_for; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_compliance_changes
    ADD CONSTRAINT fk_requested_for FOREIGN KEY (requested_for) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_study_changes fk_requested_for; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_study_changes
    ADD CONSTRAINT fk_requested_for FOREIGN KEY (requested_for) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: probands fk_study; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.probands
    ADD CONSTRAINT fk_study FOREIGN KEY (study) REFERENCES public.studies(name);


--
-- Name: study_welcome_text fk_study_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_welcome_text
    ADD CONSTRAINT fk_study_id FOREIGN KEY (study_id) REFERENCES public.studies(name) ON DELETE CASCADE;


--
-- Name: questionnaires fk_study_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaires
    ADD CONSTRAINT fk_study_id FOREIGN KEY (study_id) REFERENCES public.studies(name) ON DELETE CASCADE;


--
-- Name: pending_study_changes fk_study_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.pending_study_changes
    ADD CONSTRAINT fk_study_id FOREIGN KEY (study_id) REFERENCES public.studies(name) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: study_users fk_study_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_users
    ADD CONSTRAINT fk_study_id FOREIGN KEY (study_id) REFERENCES public.studies(name) ON DELETE CASCADE;


--
-- Name: study_planned_probands fk_study_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_planned_probands
    ADD CONSTRAINT fk_study_id FOREIGN KEY (study_id) REFERENCES public.studies(name) ON DELETE CASCADE;


--
-- Name: questionnaire_instances fk_study_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances
    ADD CONSTRAINT fk_study_id FOREIGN KEY (study_id) REFERENCES public.studies(name) ON DELETE CASCADE;


--
-- Name: study_planned_probands fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_planned_probands
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.planned_probands(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_to_contact fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.users_to_contact
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: study_users fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.study_users
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.accounts(username) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questionnaire_instances fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questionnaire_instances_queued fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.questionnaire_instances_queued
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_schedules fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.notification_schedules
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lab_results fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blood_samples fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.blood_samples
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_files fk_user_id; Type: FK CONSTRAINT; Schema: public
--

ALTER TABLE ONLY public.user_files
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.probands(pseudonym) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA loggingservice; Type: ACL; Schema: -
--

GRANT ALL ON SCHEMA loggingservice TO loggingservice_role;


--
-- Name: SCHEMA sormasservice; Type: ACL; Schema: -
--

GRANT ALL ON SCHEMA sormasservice TO sormasservice_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: loggingservice
--

ALTER DEFAULT PRIVILEGES IN SCHEMA loggingservice GRANT SELECT,USAGE ON SEQUENCES  TO loggingservice_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: loggingservice
--

ALTER DEFAULT PRIVILEGES IN SCHEMA loggingservice GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO loggingservice_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: sormasservice
--

ALTER DEFAULT PRIVILEGES IN SCHEMA sormasservice GRANT SELECT,USAGE ON SEQUENCES  TO sormasservice_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: sormasservice
--

ALTER DEFAULT PRIVILEGES IN SCHEMA sormasservice GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO sormasservice_role;


--
-- PostgreSQL database dump complete
--

--
-- Custom extension: Already included database migrations as of 2021-11-23
--
-- The following migrations still exist in order to be executed on production
-- systems, but are already included in this db dump.
--

INSERT INTO public.db_migrations(name, date)
VALUES ('/migrations/1634201157__remove_user_logs.sql', NOW()),
       ('/migrations/1636553858__pia-53_study_in_users.sql', NOW()),
       ('/migrations/1637225746__pia-2325_remove_obsolete_db_objects.sql', NOW()),
       ('/migrations/1637225747__pia-2325_remove_wrongly_created_loggingservice_tables.sql', NOW()),
       ('/migrations/1637225748__pia-2325_remove_sormas-client_user.sql', NOW()),
       ('/migrations/1637225749__pia-2325_split_users_into_probands_and_accounts.sql', NOW()),
       ('/migrations/1637595832__create_roles_for_schemas.sql', NOW());


--
-- Custom extension: Insert constant values into tables
--

INSERT INTO public.answer_types(type) VALUES ('array_single');
INSERT INTO public.answer_types(type) VALUES ('array_multi');
INSERT INTO public.answer_types(type) VALUES ('number');
INSERT INTO public.answer_types(type) VALUES ('string');
INSERT INTO public.answer_types(type) VALUES ('date');
INSERT INTO public.answer_types(type) VALUES ('sample');
INSERT INTO public.answer_types(type) VALUES ('pzn');
INSERT INTO public.answer_types(type) VALUES ('image');
INSERT INTO public.answer_types(id, type) VALUES (9, 'date_time');
INSERT INTO public.answer_types(id, type) VALUES (10, 'file');
