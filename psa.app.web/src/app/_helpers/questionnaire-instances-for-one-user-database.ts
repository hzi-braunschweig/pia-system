import { BehaviorSubject } from 'rxjs';
import { QuestionnaireInstance } from '../psa.app.core/models/questionnaireInstance';

/** An questionnaire database that the data source uses to retrieve data for the table. */
export class QuestionnaireInsancesOneUserDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<QuestionnaireInstance[]> = new BehaviorSubject<
    QuestionnaireInstance[]
  >([]);
  get data(): QuestionnaireInstance[] {
    return this.dataChange.value;
  }

  constructor() {}

  insertData(instances): void {
    this.dataChange.next(instances);
  }
}
