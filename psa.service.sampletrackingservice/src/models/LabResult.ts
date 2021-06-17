import { LabObservation } from './LabObservation';

export interface LabResult {
  id: string;
  user_id?: string | null;
  order_id?: number;
  dummy_sample_id?: string;
  performing_doctor?: string;
  date_of_sampling?: string;
  remark?: string;
  status?: string;
  study_status?: string;
  new_samples_sent?: boolean;
  lab_observations?: LabObservation[];
}
