ALTER TABLE public.study_users DROP CONSTRAINT fk_user_id;

ALTER TABLE public.pending_deletions DROP CONSTRAINT fk_requested_by;
ALTER TABLE public.pending_partial_deletions DROP CONSTRAINT fk_requested_by;
ALTER TABLE public.pending_compliance_changes DROP CONSTRAINT fk_requested_by;
ALTER TABLE public.pending_study_changes DROP CONSTRAINT fk_requested_by;

ALTER TABLE public.pending_deletions DROP CONSTRAINT fk_requested_for;
ALTER TABLE public.pending_partial_deletions DROP CONSTRAINT fk_requested_for;
ALTER TABLE public.pending_compliance_changes DROP CONSTRAINT fk_requested_for;
ALTER TABLE public.pending_study_changes DROP CONSTRAINT fk_requested_for;
