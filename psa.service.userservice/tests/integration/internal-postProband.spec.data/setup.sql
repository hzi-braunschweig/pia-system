INSERT INTO studies(name, pseudonym_prefix, pseudonym_suffix_length)
VALUES ('QTestStudy1', 'qtest', 8),
       ('QTestStudy2', 'qtest', 8),
       ('QTestStudyLimit', 'qtestlimit', 1);

INSERT INTO probands(pseudonym, ids, study, origin)
VALUES ('qtest-proband1', 'exists', 'QTestStudy1', 'investigator'),
       ('qtest-proband2', NULL, 'QTestStudy2', 'investigator'),
       ('qtestlimit-1', NULL, 'QTestStudyLimit', 'investigator'),
       ('qtestlimit-2', NULL, 'QTestStudyLimit', 'investigator'),
       ('qtestlimit-3', NULL, 'QTestStudyLimit', 'investigator'),
       ('qtestlimit-4', NULL, 'QTestStudyLimit', 'investigator'),
       ('qtestlimit-5', NULL, 'QTestStudyLimit', 'investigator');

INSERT INTO planned_probands(user_id, password)
VALUES ('qtestlimit-6', 'test'),
       ('qtestlimit-7', 'test'),
       ('qtestlimit-8', 'test'),
       ('qtestlimit-9', 'test'),
       ('qtestlimit-0', 'test');
