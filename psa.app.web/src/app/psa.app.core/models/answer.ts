export class Answer {
  question_id: number;
  questionnaire_instance_id: number;
  answer_option_id: number;
  versioning?: number;
  value: string;
  date_of_release?: Date;
  releasing_person?: string;
}
