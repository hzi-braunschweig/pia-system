INSERT INTO users (username, password, role, compliance_labresults, compliance_samples)
VALUES ('QTestProband1', '', 'Proband', true, true),
       ('QTestProband2', '', 'Proband', false, true);
INSERT INTO users (username, password, role)
VALUES ('QTestForscher1', '', 'Forscher'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin', '', 'SysAdmin');
INSERT INTO studies
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung]'),
       ('ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'),
       ('ApiTestMultiProf', 'ApiTestMultiProf Beschreibung');
INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie2', 'QTestProband2', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'read'),
       ('ApiTestStudie', 'QTestProbandenManager', 'read'),
       ('ApiTestStudie', 'QTestUntersuchungsteam', 'read'),
       ('ApiTestMultiProf', 'QTestForscher1', 'read'),
       ('ApiTestMultiProf', 'QTestProbandenManager', 'read'),
       ('ApiTestMultiProf', 'QTestUntersuchungsteam', 'read');
INSERT INTO lab_results (id, user_id, order_id, date_of_sampling, status, remark, new_samples_sent, performing_doctor,
                         dummy_sample_id, study_status)
VALUES ('TEST-12345', 'QTestProband1', 12345, '2021-01-07T16:00+01:00', 'analyzed', null, true, '',
        'TEST-10345', 'active'),
       ('TEST-12346', 'QTestProband1', 12346, '2021-01-07T16:00+01:00', 'analyzed', null, true, 'Dr Who', null,
        'active'),
       ('TEST-12347', 'QTestProband2', 12346, '2021-01-07T16:00+01:00', 'analyzed', null, true, 'Dr Who', null,
        'active'),
       ('TEST-12348', 'QTestProband1', null, '2021-01-07T16:00+01:00', null, null, true, '', null, 'deleted'),
       ('TEST-12349', 'QTestProband1', 12345, '2021-01-07T16:00+01:00', 'analyzed', null, true, '', null,
        'pending_for_deletion'),
       ('TEST-1134567890', 'QTestProband1', null, null, 'new', null, false, 'Dr WHo', 'TEST-1034567890', 'active');
INSERT INTO lab_observations (id, lab_result_id, name_id, name, result_value, comment, date_of_analysis,
                              date_of_delivery, date_of_announcement, lab_name, material, result_string, unit,
                              other_unit, kit_name)
VALUES (9999991, 'TEST-12345', 12345, 'Adenovirus-PCR (resp.)', null, 'This is a simple comment',
        '2000-02-01T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        null, 'negativ', 'unit', null, null),
       (9999992, 'TEST-12345', 12345, 'Adenovirus-PCR (resp.)', null, 'This is a simple comment',
        '2000-02-02T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        null, 'negativ', 'unit', null, null),
       (9999993, 'TEST-12346', 12345, 'Adenovirus-PCR (resp.)', 30, 'Another comment', '2000-02-03T00:00+01:00',
        '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab', null, 'positiv', 'unit', null,
        null),
       (9999994, 'TEST-12346', 12345, 'Adenovirus-PCR (resp.)', null, 'Another comment',
        '2000-02-04T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        null, 'negativ', 'unit', null, null),
       (9999995, 'TEST-12347', 12345, 'Adenovirus-PCR (resp.)', 30, null, '2000-02-05T00:00+01:00',
        '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab', null, 'positiv', 'unit', null,
        null),
       (9999996, 'TEST-12347', 12345, 'Adenovirus-PCR (resp.)', null, 'This is a simple comment',
        '2000-02-06T00:00+01:00', '2021-01-07T17:53+01:00', '2021-01-07T17:53+01:00', 'cool lab',
        null, 'negativ', 'unit', null, null);
