export interface LabObservation {
  id: string;
  lab_result_id?: string;
  name_id?: number;
  name?: string;
  result_value?: string;
  comment?: string;
  date_of_analysis?: Date;
  date_of_delivery?: Date;
  date_of_announcement?: Date;
  lab_name?: string;
  material?: string;
  result_string?: string;
  unit?: string;
  other_unit?: string;
  kit_name?: string;
}
