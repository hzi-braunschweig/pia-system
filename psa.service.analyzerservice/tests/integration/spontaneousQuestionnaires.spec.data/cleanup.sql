DELETE FROM probands WHERE pseudonym LIKE 'QTest%';
DELETE FROM questionnaires WHERE id IN (99999);
DELETE FROM studies WHERE name IN ('ApiTestStudie');
