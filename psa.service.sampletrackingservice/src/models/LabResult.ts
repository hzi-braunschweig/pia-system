import { LabObservation } from './LabObservation';

export interface LabResult {
  id: string;
  user_id?: string | null;
  order_id?: number | null;
  dummy_sample_id?: string | null;
  performing_doctor?: string | null;
  date_of_sampling?: string | null;
  remark?: string | null;
  status?: string | null;
  study_status?: string | null;
  new_samples_sent?: boolean;
  lab_observations?: LabObservation[];
}
