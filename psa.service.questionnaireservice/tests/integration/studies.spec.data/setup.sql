INSERT INTO studies(name, description, pm_email, hub_email, status, address, has_rna_samples, sample_prefix,
                    sample_suffix_length, has_logging_opt_in)
VALUES ('QTestStudy1', 'QTestStudy1 Beschreibung', 'pm@pia.de', 'hub@pia.de', 'active',
        'Studienzentrum des QTestStudy1 für Infektionsforschung<br> QTestStudy1<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: QTestStudy1@QTestStudy1.de',
        FALSE, 'TESTPREFIX', 5, FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('QTestStudy2', 'QTestStudy2 Beschreibung', FALSE),
       ('QTestStudy3', 'QTestStudy3 Beschreibung', FALSE);

INSERT INTO probands (pseudonym, study)
VALUES ('QTestProband1', 'QTestStudy1'),
       ('QTestProband2', 'QTestStudy2'),
       ('QTestProband3', 'QTestStudy3');

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),
       ('QTestProband3', '', 'Proband'),
       ('QTestForscher1', '', 'Forscher'),
       ('QTestForscher2', '', 'Forscher'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestUntersuchungsteam2', '', 'Untersuchungsteam'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestSysAdmin', '', 'SysAdmin');

INSERT INTO study_welcome_text(study_id, welcome_text, language)
VALUES ('QTestStudy1', '# Welcome to our study! We are happy to have you with us!', 'de_DE');
INSERT INTO study_welcome_text(study_id, welcome_text, language)
VALUES ('QTestStudy2', 'Welcome <img src=x onerror=alert(1)//> home !', 'de_DE');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'QTestForscher1', 'write'),
       ('QTestStudy3', 'QTestForscher1', 'admin'),
       ('QTestStudy2', 'QTestForscher2', 'admin'),
       ('QTestStudy3', 'QTestForscher2', 'admin'),
       ('QTestStudy1', 'QTestUntersuchungsteam', 'write'),
       ('QTestStudy2', 'QTestUntersuchungsteam2', 'write'),
       ('QTestStudy1', 'QTestProbandenManager', 'write');

INSERT INTO pending_study_changes(id, requested_by, requested_for, study_id, description_from, description_to,
                                  has_rna_samples_from, has_rna_samples_to, sample_prefix_from, sample_prefix_to,
                                  sample_suffix_length_from, sample_suffix_length_to, has_answers_notify_feature_from,
                                  has_answers_notify_feature_to, has_answers_notify_feature_by_mail_from,
                                  has_answers_notify_feature_by_mail_to, has_four_eyes_opposition_from,
                                  has_four_eyes_opposition_to, has_partial_opposition_from, has_partial_opposition_to,
                                  has_total_opposition_from, has_total_opposition_to, has_compliance_opposition_from,
                                  has_compliance_opposition_to, pseudonym_prefix_from, pseudonym_prefix_to,
                                  pseudonym_suffix_length_from, pseudonym_suffix_length_to, has_logging_opt_in_from,
                                  has_logging_opt_in_to)
VALUES (88888888, 'QTestForscher1', 'QTestForscher2', 'QTestStudy3', 'QTestStudy3 Beschreibung',
        'QTestStudy3 Beschreibung Changed', FALSE, TRUE, NULL, NULL, 0, 0, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE,
        FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, NULL, NULL, FALSE, TRUE);
