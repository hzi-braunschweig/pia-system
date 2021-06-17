INSERT INTO personal_data(pseudonym, study, anrede, titel, name, vorname, strasse, haus_nr, plz, landkreis, ort,
                          telefon_privat, telefon_dienst, telefon_mobil, email, comment)
VALUES ('QTestProband1', 'QTestStudy1', 'Herr', 'prof', 'TestNachname1', 'TestVorname1', 'Strasse', '12', '53340', 'NRW', NULL, NULL,
        NULL, NULL, NULL, NULL),
       ('QTestProband2', 'QTestStudy2', 'Herr', 'prof', 'TestNachname2', 'TestVorname2', 'Strasse', '12', '53340', 'NRW', NULL, NULL,
        NULL, NULL, 'apitestproband2@example.com', NULL),
       ('QTestProband3', 'QTestStudy1', 'Herr', 'prof', 'TestNachname13', 'TestVorname13', 'Strasse', '12', '53340', 'NRW', NULL, NULL,
        NULL, NULL, 'apitestproband3@example.com', NULL),
       ('QTestProband4', 'QTestStudy1', 'Herr', 'prof', 'TestNachname4', 'TestVorname4', 'Strasse', '12', '53340', 'NRW', NULL, NULL,
        NULL, NULL, 'apitestproband2@example.com', NULL);

INSERT INTO pending_deletions(requested_by, requested_for, proband_id, study, id)
VALUES ('pm1@example.com', 'pm2@example.com', 'QTestProband1', 'QTestStudy1', 1234560),
       ('pmNoEmail', 'pm1@example.com', 'QTestProband3', 'QTestStudy1', 1234561);
