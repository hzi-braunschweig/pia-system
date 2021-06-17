DELETE FROM users WHERE username IN ('ApiTestProband1', 'ApiTestProband2', 'forscher1@apitest.de', 'forscher2@apitest.de', 'forscher4@apitest.de', 'forscherNoEmail', 'ut1@apitest.de', 'ut2@apitest.de', 'pm1@apitest.de', 'pm2@apitest.de', 'sa1@apitest.de', 'sa2@apitest.de');
DELETE FROM studies WHERE name IN('ApiTestStudie1', 'ApiTestStudie2', 'ApiTestMultiProband', 'ApiTestMultiProf')
