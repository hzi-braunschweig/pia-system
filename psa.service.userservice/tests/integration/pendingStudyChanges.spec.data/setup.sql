/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('QTestStudie1', 'QTestStudie1 Beschreibung', FALSE),
       ('QTestStudie2', 'QTestStudie2 Beschreibung', FALSE),
       ('QTestStudie3', 'QTestStudie3 Beschreibung]', FALSE);

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),

       ('forscher1@example.com', '', 'Forscher'),
       ('forscher2@example.com', '', 'Forscher'),
       ('forscherNoEmail', '', 'Forscher'),
       ('forscher4@example.com', '', 'Forscher'),
       ('ut1@example.com', '', 'Untersuchungsteam'),
       ('pm1@example.com', '', 'ProbandenManager'),
       ('sa1@example.com', '', 'SysAdmin'),
       ('sa2@example.com', '', 'SysAdmin');

INSERT INTO probands (pseudonym, compliance_labresults, compliance_samples, compliance_bloodsamples, study)
VALUES ('QTestProband1', TRUE, TRUE, TRUE, 'QTestStudie1');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudie1', 'forscher1@example.com', 'admin'),
       ('QTestStudie1', 'forscher2@example.com', 'admin'),
       ('QTestStudie1', 'forscherNoEmail', 'admin'),
       ('QTestStudie1', 'ut1@example.com', 'write'),
       ('QTestStudie1', 'pm1@example.com', 'write'),

       ('QTestStudie2', 'forscher1@example.com', 'admin'),
       ('QTestStudie2', 'forscher2@example.com', 'admin'),

       ('QTestStudie3', 'ut1@example.com', 'write'),
       ('QTestStudie3', 'forscher1@example.com', 'admin'),
       ('QTestStudie3', 'forscher2@example.com', 'admin'),
       ('QTestStudie3', 'forscherNoEmail', 'admin'),
       ('QTestStudie3', 'forscher4@example.com', 'write');

INSERT INTO pending_study_changes(id, requested_by, requested_for, study_id, description_from, description_to,
                                  has_rna_samples_from, has_rna_samples_to, sample_prefix_from, sample_prefix_to,
                                  sample_suffix_length_from, sample_suffix_length_to, has_answers_notify_feature_from,
                                  has_answers_notify_feature_to, has_answers_notify_feature_by_mail_from,
                                  has_answers_notify_feature_by_mail_to, has_four_eyes_opposition_from,
                                  has_four_eyes_opposition_to, has_partial_opposition_from, has_partial_opposition_to,
                                  has_total_opposition_from, has_total_opposition_to, has_compliance_opposition_from,
                                  has_compliance_opposition_to, has_logging_opt_in_from, has_logging_opt_in_to)
VALUES (1234560, 'forscher1@example.com', 'forscher2@example.com', 'QTestStudie1', 'QTestStudie1 Beschreibung',
        'DescriptionChange', FALSE, TRUE, NULL, NULL, 0, 0, FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE,
        FALSE, TRUE, FALSE, FALSE, TRUE);
