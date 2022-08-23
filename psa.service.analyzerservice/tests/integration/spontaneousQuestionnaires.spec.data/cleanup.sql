DELETE FROM probands WHERE pseudonym LIKE 'qtest%';
DELETE FROM questionnaires WHERE id IN (99999);
DELETE FROM studies WHERE name IN ('ApiTestStudie');
