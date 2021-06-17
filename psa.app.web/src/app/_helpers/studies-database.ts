import { BehaviorSubject } from 'rxjs';
import { Studie } from '../psa.app.core/models/studie';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';

/** An questionnaire database that the data source uses to retrieve data for the table. */
export class StudiesDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<Studie[]> = new BehaviorSubject<Studie[]>([]);
  get data(): Studie[] {
    return this.dataChange.value;
  }

  studies: Studie[];
  constructor(
    private questionnaireService: QuestionnaireService,
    private translate: TranslateService,
    private alertService: AlertService,
    doFilterZIFCO = false
  ) {
    this.questionnaireService.getStudies().then(
      (result: any) => {
        this.studies = result.studies;

        // hard coded filtering of ZIFCO-Studie
        if (doFilterZIFCO) {
          this.studies = this.studies.filter(
            (study) => study.name !== 'ZIFCO-Studie'
          );
        }
        this.studies.forEach((study, studyIndex) => {
          if (study.status === 'active') {
            study.status = 'STUDIES.STATUS_ACTIV';
          } else if (study.status === 'deletion_pending') {
            study.status = 'STUDIES.STATUS_DELETION_PENDING';
          } else if (study.status === 'deleted') {
            study.status = 'STUDIES.STATUS_DELETED';
          }
          const copiedData = this.data.slice();
          copiedData.push(study);
          this.dataChange.next(copiedData);
        });
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }

  deleteStudy(name: string): void {
    this.questionnaireService.deleteStudy(name).then(
      (result: any) => {
        const succesText = result.body;
        const copiedData = this.data;
        const index = copiedData.findIndex((d) => d.name === name);
        copiedData.splice(index, 1);
        this.dataChange.next(copiedData);
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }
}
