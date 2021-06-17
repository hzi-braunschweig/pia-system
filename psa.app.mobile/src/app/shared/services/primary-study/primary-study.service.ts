import { Injectable } from '@angular/core';

import { QuestionnaireClientService } from '../../../questionnaire/questionnaire-client.service';
import { Study } from '../../../questionnaire/questionnaire.model';

@Injectable({
  providedIn: 'root',
})
export class PrimaryStudyService {
  constructor(private questionnaireClient: QuestionnaireClientService) {}

  getPrimaryStudy(): Promise<Study> {
    return this.questionnaireClient.getStudies().then((result) => {
      if (!result) {
        return null;
      } else {
        return result.studies.find((study) => !study.super_study_name);
      }
    });
  }
}
