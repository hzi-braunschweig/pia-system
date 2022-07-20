/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO personal_data (pseudonym, study, anrede, titel, name, vorname, strasse, haus_nr, plz, landkreis, ort)
VALUES ('qtest-proband1', 'QTestStudy1', 'Herr', NULL, 'Testname1', 'Testvorname1', 'Teststr.', '666', '66666', 'NRW', 'Bonn');

INSERT INTO pending_deletions (requested_by, requested_for, proband_id, study, id)
VALUES ('pm1@example.com', 'pm2@example.com', 'qtest-proband1', 'QTestStudy1', 1234560);
