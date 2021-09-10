ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_updated_at_column_on_insert on questionnaires;
DROP TRIGGER IF EXISTS update_updated_at_column_on_update on questionnaires;

CREATE TRIGGER update_updated_at_column_on_insert BEFORE INSERT ON questionnaires FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_updated_at_column_on_update BEFORE UPDATE ON questionnaires FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
