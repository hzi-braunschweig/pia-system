INSERT INTO studies(name, pseudonym_prefix, pseudonym_suffix_length)
VALUES ('QTestStudy1', 'qtest', 8),
       ('QTestStudy2', 'qtest', 8),
       ('QTestStudyLimit', 'qtestlimit', 2);

INSERT INTO probands(pseudonym, ids, study, origin)
VALUES ('qtest-proband1', 'exists', 'QTestStudy1', 'investigator'),
       ('qtest-proband2', NULL, 'QTestStudy2', 'investigator');

do
$$
    begin
        for i in 1..49
            loop
                INSERT INTO probands(pseudonym, ids, study, origin)
                VALUES (CONCAT('qtestlimit-', TO_CHAR(i,'fm00')), NULL, 'QTestStudyLimit', 'investigator');
            end loop;
        for i in 50..99
            loop
                INSERT INTO planned_probands(user_id, password)
                VALUES (CONCAT('qtestlimit-', i), 'test');
            end loop;
    end;
$$;
