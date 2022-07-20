DELETE
FROM study_users
WHERE user_id IN
      ('qtest-proband1', 'qtest-forscher1', 'qtest-proband2', 'qtest-forscher2', 'ut@apitest.de', 'ut2@apitest.de',
       'qtest-probandenmanager');
DELETE
FROM probands
WHERE pseudonym IN
      ('qtest-proband1', 'qtest-proband2');

DELETE
FROM planned_probands
WHERE user_id IN ('planned1', 'planned2', 'planned3', 'planned4', 'planned5');
DELETE
FROM studies
WHERE name IN ('ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProband', 'ApiTestMultiProf');
