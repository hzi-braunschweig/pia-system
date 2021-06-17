export interface SampleAnswer {
  date_of_sampling: Date;
  dummy_sample_id?: string;
}

export interface LabResult {
  id: string;
  user_id: string;
  date_of_sampling: string;
  status: string;
  remark: string;
  new_samples_sent: boolean;
  performing_doctor: string;
  dummy_sample_id: string;
}
