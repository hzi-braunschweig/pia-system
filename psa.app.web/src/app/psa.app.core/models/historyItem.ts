export class HistoryItem {
  versioning: number;
  releasing_person_old: string;
  releasing_person_new: string;
  releasing_person: string;
  date_of_release_old: Date;
  date_of_release_new: Date;
  question_items: QuestionItem[];
}

export class QuestionItem {
  description: string;
  subquestion_items: SubQuestion[];
  position: number;
}

export class SubQuestion {
  position: number;
  description: string;
  value_old: string;
  value_new: string;
}
