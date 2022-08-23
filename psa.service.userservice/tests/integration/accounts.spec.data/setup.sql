/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name, has_logging_opt_in)
VALUES ('TestStudy', FALSE), ('AnotherStudy', FALSE);

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('TestStudy', 'pm1@example.com', 'write'),
       ('TestStudy', 'pm2@example.com', 'write'),
       ('TestStudy', 'forscher1@example.com', 'admin'),
       ('TestStudy', 'forscher2@example.com', 'write'),
       ('TestStudy', 'forscher3@example.com', 'write'),
       ('AnotherStudy', 'forscher3@example.com', 'admin'),
       ('AnotherStudy', 'forscher4@example.com', 'admin'),
       ('TestStudy', 'ut1@example.com', 'write'),
       ('TestStudy', 'ut2@example.com', 'admin');