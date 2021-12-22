INSERT INTO studies (name)
VALUES ('QTestStudy');

INSERT INTO probands (pseudonym, study, compliance_labresults, compliance_samples)
VALUES ('QTestProband1', 'QTestStudy', TRUE, TRUE),
       ('QTestProband2', 'QTestStudy', FALSE, TRUE),
       ('QTestProband3', 'QTestStudy', TRUE, TRUE);

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),
       ('QTestProband3', '', 'Proband'),
       ('QTestForscher1', '', 'Forscher'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin', '', 'SysAdmin');

INSERT INTO lab_results (id, user_id, order_id, date_of_sampling, status, remark, new_samples_sent, performing_doctor,
                         dummy_sample_id, study_status)
VALUES ('TEST-12345', 'QTestProband1', 12345, '2021-01-07T16:00+01:00', 'analyzed', NULL, TRUE, '',
        'TEST-10345', 'active'),
       ('TEST-12346', 'QTestProband1', 12346, '2021-01-07T16:00+01:00', 'analyzed', NULL, TRUE, 'Dr Who', NULL,
        'active'),
       ('TEST-12347', 'QTestProband2', 12346, '2021-01-07T16:00+01:00', 'analyzed', NULL, TRUE, 'Dr Who', NULL,
        'active'),
       ('TEST-12348', 'QTestProband1', NULL, '2021-01-07T16:00+01:00', NULL, NULL, TRUE, '', NULL, 'deleted'),
       ('TEST-12349', 'QTestProband1', 12345, '2021-01-07T16:00+01:00', 'analyzed', NULL, TRUE, '', NULL,
        'pending_for_deletion'),
       ('TEST-1134567890', 'QTestProband1', NULL, NULL, 'new', NULL, FALSE, 'Dr WHo', 'TEST-1034567890', 'active');

INSERT INTO lab_observations (id, lab_result_id, name_id, name, result_value, comment, date_of_analysis,
                              date_of_delivery, date_of_announcement, lab_name, material, result_string, unit,
                              other_unit, kit_name)
VALUES (9999991, 'TEST-12345', 12345, 'Adenovirus-PCR (resp.)', NULL, 'This is a simple comment',
        '2000-02-01T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        NULL, 'negativ', 'unit', NULL, NULL),
       (9999992, 'TEST-12345', 12345, 'Adenovirus-PCR (resp.)', NULL, 'This is a simple comment',
        '2000-02-02T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        NULL, 'negativ', 'unit', NULL, NULL),
       (9999993, 'TEST-12346', 12345, 'Adenovirus-PCR (resp.)', 30, 'Another comment', '2000-02-03T00:00+01:00',
        '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab', NULL, 'positiv', 'unit', NULL,
        NULL),
       (9999994, 'TEST-12346', 12345, 'Adenovirus-PCR (resp.)', NULL, 'Another comment',
        '2000-02-04T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        NULL, 'negativ', 'unit', NULL, NULL),
       (9999995, 'TEST-12347', 12345, 'Adenovirus-PCR (resp.)', 30, NULL, '2000-02-05T00:00+01:00',
        '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab', NULL, 'positiv', 'unit', NULL,
        NULL),
       (9999996, 'TEST-12347', 12345, 'Adenovirus-PCR (resp.)', NULL, 'This is a simple comment',
        '2000-02-06T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        NULL, 'negativ', 'unit', NULL, NULL);
