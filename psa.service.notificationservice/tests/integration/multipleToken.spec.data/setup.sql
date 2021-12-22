INSERT INTO studies (name, status, has_answers_notify_feature, has_answers_notify_feature_by_mail,
                     pm_email, hub_email)
VALUES ('QTestStudie', 'active', TRUE, TRUE, 'pm@pia.test', 'hub@pia.test');

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProbandenManager', '', 'ProbandenManager');

INSERT INTO probands (pseudonym, study)
VALUES ('QTestProband1', 'QTestStudie')
