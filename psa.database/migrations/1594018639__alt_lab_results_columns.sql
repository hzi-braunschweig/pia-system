BEGIN;
    -- add new lab observation columns which currently exist at lab_result
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS comment TEXT;
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS date_of_analysis TIMESTAMP;
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS date_of_delivery TIMESTAMP;
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS date_of_announcement TIMESTAMP;

    -- add new columns for extended lab observation information
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS lab_name TEXT NOT NULL DEFAULT 'MHH';
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS material TEXT NOT NULL DEFAULT 'Nasenabstrich';
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS result_string TEXT;
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS unit TEXT;
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS other_unit TEXT;
    ALTER TABLE lab_observations ADD COLUMN IF NOT EXISTS kit_name TEXT;

    -- remove "MHH" as default lab name after migration
    ALTER TABLE lab_observations ALTER COLUMN lab_name DROP NOT NULL;
    ALTER TABLE lab_observations ALTER COLUMN lab_name DROP DEFAULT;

    -- remove "Nasenabstrich" as default material after migration
    ALTER TABLE lab_observations ALTER COLUMN material DROP NOT NULL;
    ALTER TABLE lab_observations ALTER COLUMN material DROP DEFAULT;

    -- from now on allow values to be in any text format
    ALTER TABLE lab_observations ALTER COLUMN result_value TYPE TEXT;

    -- add uniqueness constraint to avoid duplicated lab observations
    ALTER TABLE lab_observations DROP CONSTRAINT IF EXISTS unique_lab_observation;
    ALTER TABLE lab_observations
        ADD CONSTRAINT unique_lab_observation
        UNIQUE (lab_result_id, name, date_of_analysis, lab_name);

    -- from now on handle lab result ids always as uppercase
    ALTER TABLE lab_observations DROP CONSTRAINT fk_lab_result_id;
    UPDATE lab_results SET id = UPPER(id);
    UPDATE lab_results SET dummy_sample_id = UPPER(dummy_sample_id);
    UPDATE lab_observations SET lab_result_id = UPPER(lab_result_id);
    ALTER TABLE lab_observations ADD CONSTRAINT fk_lab_result_id
        FOREIGN KEY (lab_result_id)
        REFERENCES lab_results(id)
        ON DELETE CASCADE;

    -- force ids to be uppercase
    ALTER TABLE lab_results DROP CONSTRAINT IF EXISTS upper_case_check;
    ALTER TABLE lab_results ADD CONSTRAINT upper_case_check CHECK (
        UPPER(id) = id AND UPPER(dummy_sample_id) = dummy_sample_id
    );

    -- as a consequence we also have to migrate existing lab result id references to uppercase
    UPDATE notification_schedules SET reference_id = UPPER(reference_id) WHERE notification_type='sample';
    UPDATE pending_deletions SET for_id = UPPER(for_id) WHERE type='sample';
    UPDATE pending_partial_deletions SET for_lab_results_ids = UPPER(for_lab_results_ids::text)::text[];

    -- migrate result_bool to result_string if column still exists
    DO $$
    BEGIN
        IF EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='lab_observations' and column_name='result_bool')
        THEN
            UPDATE lab_observations SET result_string = (CASE
                WHEN result_bool = TRUE THEN 'positiv'
                WHEN result_bool = FALSE THEN 'negativ'
                ELSE NULL
            END);

            -- drop now obsolete result_bool column
            ALTER TABLE lab_observations DROP COLUMN result_bool;
        END IF;
    END;
    $$;

    -- copy values from existing lab results to existing lab observations if columns still exist
    DO $$
    BEGIN
        IF EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='lab_results' and column_name='comment')
            AND EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='lab_results' and column_name='date_of_analysis')
            AND EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='lab_results' and column_name='date_of_delivery')
            AND EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='lab_results' and column_name='date_of_announcement')
        THEN
            UPDATE lab_observations SET
                comment = lab_results.comment,
                date_of_analysis = lab_results.date_of_analysis,
                date_of_delivery = lab_results.date_of_delivery,
                date_of_announcement = lab_results.date_of_announcement
            FROM lab_results
            WHERE lab_observations.lab_result_id = lab_results.id;

            -- drop now obsolete columns from lab results
            ALTER TABLE lab_results DROP COLUMN comment;
            ALTER TABLE lab_results DROP COLUMN date_of_analysis;
            ALTER TABLE lab_results DROP COLUMN date_of_delivery;
            ALTER TABLE lab_results DROP COLUMN date_of_announcement;
        END IF;
    END;
    $$;

COMMIT;
