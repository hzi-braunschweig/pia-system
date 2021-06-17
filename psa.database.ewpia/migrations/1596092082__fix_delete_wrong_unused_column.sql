ALTER TABLE compliance_texts
    DROP COLUMN IF EXISTS compliance_id;

ALTER TABLE compliance_questionnaire_placeholders
    DROP COLUMN IF EXISTS compliance_id;
