export class Studie {
  name: string;
  description: string;
  access_level: string;
  pm_email: string = null;
  hub_email: string = null;
  status: string;
  has_rna_samples?: boolean;
  sample_prefix?: string;
  sample_suffix_length?: number;
  pseudonym_prefix?: string;
  pseudonym_suffix_length?: number;
  super_study_name?: string;
  has_answers_notify_feature: boolean = false;
  has_answers_notify_feature_by_mail: boolean = false;
  has_four_eyes_opposition: boolean = true;
  has_partial_opposition: boolean = true;
  has_total_opposition: boolean = true;
  has_compliance_opposition: boolean = true;
  pendingStudyChange: any = null;
}
