INSERT INTO probands (pseudonym, study) VALUES ('qtest-proband1', 'QTestStudie');

INSERT INTO notification_schedules
VALUES (99996, 'qtest-proband1', '2019-07-09 09:56:00', 'qReminder', 99995, null, null),
       (99997, 'qtest-proband1', '2019-07-09 09:56:00', 'qReminder', 9999996, null, null),
       (99998, 'qtest-proband1', '2019-07-09 09:56:00', 'sample', 'LAB_RESULT-9999999999', null, null),
       (99999, 'qtest-proband1', '2019-07-09 09:56:00', 'custom', '', 'I am a custom title', E'Here is\ncustom body'),
       (99991, 'qtest-proband1', '2019-07-09 09:56:00', 'questionnaires_stats_aggregator', 'test@example.local', 'Questionnaire stats aggregator', E'Statistics for\na questionnaire');
