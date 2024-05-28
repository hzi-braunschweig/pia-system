/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name) VALUES ('Study');

INSERT INTO probands (pseudonym, status, study) VALUES ('participant-123456789', 'active', 'Study');