INSERT INTO users (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProbandenManager', '', 'ProbandenManager');

INSERT INTO studies (name, description, status, has_answers_notify_feature, has_answers_notify_feature_by_mail,
                     pm_email, hub_email)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung', 'active', true, true, 'pm@pia.test', 'hub@pia.test');

INSERT INTO study_users
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie', 'QTestProbandenManager', 'read');
