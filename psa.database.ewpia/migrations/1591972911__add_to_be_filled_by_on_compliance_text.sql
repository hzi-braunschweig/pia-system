ALTER TABLE compliance_texts
    ADD COLUMN IF NOT EXISTS to_be_filled_by text default 'Proband';
