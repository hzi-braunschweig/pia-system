/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  Questionnaire,
  QuestionnaireListResponse,
} from '../../models/questionnaire';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceResponse,
  QuestionnaireStatus,
} from '../../models/questionnaireInstance';
import { QuestionnaireInstanceQueue } from '../../models/questionnaireInstanceQueue';
import { Answer } from '../../models/answer';
import { Studie } from '../../models/studie';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { map, pluck } from 'rxjs/operators';
import { StudyWelcomeText } from 'src/app/psa.app.core/models/studyWelcomeText';
import { PendingPartialDeletionResponse } from '../../models/pendingPartialDeletion';

@Injectable()
export class QuestionnaireService {
  private static questionnaireInstanceDateConverter = map(
    (instances: QuestionnaireInstance[]) => {
      instances.forEach((instance) => {
        instance.date_of_issue = instance.date_of_issue
          ? new Date(instance.date_of_issue)
          : null;
        instance.date_of_release_v1 = instance.date_of_release_v1
          ? new Date(instance.date_of_release_v1)
          : null;
        instance.date_of_release_v2 = instance.date_of_release_v2
          ? new Date(instance.date_of_release_v2)
          : null;
      });
      return instances;
    }
  );

  private readonly apiUrl = 'api/v1/questionnaire/';

  constructor(private http: HttpClient, private auth: AuthenticationManager) {}

  getQuestionnaire(
    questionnaireId: number,
    version: number
  ): Promise<Questionnaire> {
    return this.http
      .get<Questionnaire>(
        this.apiUrl + 'questionnaires/' + questionnaireId + '/' + version
      )
      .toPromise();
  }

  deleteQuestionnaire(questionnaireId: number, version: number): Promise<void> {
    return this.http
      .delete<void>(
        this.apiUrl + 'questionnaires/' + questionnaireId + '/' + version
      )
      .toPromise();
  }

  deleteAnswer(
    questionnaireInstanceId: number,
    answerOptionId: number
  ): Promise<void> {
    return this.http
      .delete<void>(
        this.apiUrl +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers/' +
          answerOptionId
      )
      .toPromise();
  }

  getQuestionnaires(): Promise<QuestionnaireListResponse> {
    return this.http
      .get<QuestionnaireListResponse>(this.apiUrl + 'questionnaires')
      .toPromise();
  }

  postQuestionnaire(postData: object): Promise<any> {
    return this.http
      .post<any>(this.apiUrl + 'questionnaires', postData)
      .toPromise();
  }

  putQuestionnaire(
    questionnaireId: number,
    version: number,
    putData: object
  ): Promise<Questionnaire> {
    return this.http
      .put<Questionnaire>(
        this.apiUrl + 'questionnaires/' + questionnaireId + '/' + version,
        putData
      )
      .toPromise();
  }

  /**
   * Currently Questionnaires can only be deactivated and not vice versa.
   */
  deactivateQuestionnaire(
    studyName: string,
    questionnaireId: number,
    version: number
  ): Promise<Questionnaire> {
    return this.http
      .patch<Questionnaire>(
        this.apiUrl +
          studyName +
          '/questionnaires/' +
          questionnaireId +
          '/' +
          version,
        { active: false }
      )
      .toPromise();
  }

  reviseQuestionnaire(
    questionnaireId: number,
    putData: object
  ): Promise<Questionnaire> {
    return this.http
      .post<Questionnaire>(
        this.apiUrl + 'revisequestionnaire/' + questionnaireId,
        putData
      )
      .toPromise();
  }

  getQuestionnaireInstancesForUser(
    username: string
  ): Promise<QuestionnaireInstance[]> {
    return this.http
      .get<QuestionnaireInstanceResponse>(
        this.apiUrl + 'user/' + username + '/questionnaireInstances'
      )
      .pipe(pluck('questionnaireInstances'))
      .pipe(QuestionnaireService.questionnaireInstanceDateConverter)
      .toPromise();
  }

  getQuestionnaireInstances(
    status?: QuestionnaireStatus[]
  ): Promise<QuestionnaireInstance[]> {
    return this.http
      .get<QuestionnaireInstanceResponse>(
        this.apiUrl + 'questionnaireInstances',
        { params: { status } }
      )
      .pipe(pluck('questionnaireInstances'))
      .pipe(QuestionnaireService.questionnaireInstanceDateConverter)
      .toPromise();
  }

  getQuestionnaireInstance(
    questionnaireInstanceId: number
  ): Promise<QuestionnaireInstance> {
    return this.http
      .get<QuestionnaireInstance>(
        this.apiUrl + 'questionnaireInstances/' + questionnaireInstanceId
      )
      .toPromise();
  }

  putQuestionnaireInstance(
    questionnaireInstanceId: number,
    putData: object
  ): Promise<QuestionnaireInstance> {
    return this.http
      .put<QuestionnaireInstance>(
        this.apiUrl + 'questionnaireInstances/' + questionnaireInstanceId,
        putData
      )
      .toPromise();
  }

  postAnswers(
    questionnaireInstanceId: number,
    postData: object
  ): Promise<{ answers: Answer[] }> {
    return this.http
      .post<{ answers: Answer[] }>(
        this.apiUrl +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers',
        postData
      )
      .toPromise();
  }

  getAnswers(questionnaireInstanceId: number): Promise<{ answers: Answer[] }> {
    return this.http
      .get<{ answers: Answer[] }>(
        this.apiUrl +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers'
      )
      .toPromise();
  }

  getHistoricalAnswers(questionnaireInstanceId: number): Promise<Answer[]> {
    return this.http
      .get<{ answers: Answer[] }>(
        this.apiUrl +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answersHistorical'
      )
      .pipe(pluck('answers'))
      .toPromise();
  }

  getStudies(): Promise<{ studies: Studie[] }> {
    return this.http
      .get<{ studies: Studie[] }>(this.apiUrl + 'studies')
      .toPromise();
  }

  getPrimaryStudy(): Promise<Studie> {
    return this.getStudies().then((result) => {
      if (!result) {
        return null;
      } else {
        return result.studies.find((study) => !study.super_study_name);
      }
    });
  }

  getStudiesOfProband(probandName): Promise<any> {
    return this.http
      .get(this.apiUrl + 'studies/proband/' + probandName)
      .toPromise();
  }

  deleteStudy(name: string): Promise<void> {
    return this.http.delete<void>(this.apiUrl + 'studies/' + name).toPromise();
  }

  postStudy(postData: object): Promise<any> {
    return this.http.post(this.apiUrl + 'studies', postData).toPromise();
  }

  putStudy(name: string, putData: object): Promise<any> {
    return this.http.put(this.apiUrl + 'studies/' + name, putData).toPromise();
  }

  getStudy(name: string): Promise<Studie> {
    return this.http.get<Studie>(this.apiUrl + 'studies/' + name).toPromise();
  }

  getStudyAddresses(): Promise<any> {
    return this.http.get(this.apiUrl + 'studies/addresses').toPromise();
  }

  getStudyAccesses(name: string): Promise<Studie[]> {
    return this.http
      .get<Studie[]>(this.apiUrl + 'studies/' + name + '/accesses')
      .toPromise();
  }

  deleteUserFromStudy(username: string, study_name: string): Promise<void> {
    return this.http
      .delete<void>(
        this.apiUrl + 'studies/' + study_name + '/accesses/' + username
      )
      .toPromise();
  }

  postStudyAccess(username: string, postData: object): Promise<any> {
    return this.http
      .post(this.apiUrl + 'studies/' + username + '/accesses', postData)
      .toPromise();
  }

  putStudyAccess(
    username: string,
    putData: object,
    study_name: string
  ): Promise<any> {
    return this.http
      .put(
        this.apiUrl + 'studies/' + study_name + '/accesses/' + username,
        putData
      )
      .toPromise();
  }

  getExportData(postData: any): Observable<HttpEvent<Blob>> {
    // convert dates to utc string to prevent timezone issues
    const convertedData: any = Object.assign({}, postData);
    if (convertedData.start_date) {
      convertedData.start_date = postData.start_date.toDateString();
    }
    if (convertedData.end_date) {
      convertedData.end_date = postData.end_date.toDateString();
    }
    return this.http.post(this.apiUrl + 'dataExport/searches', convertedData, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  getQuestionnaireInstanceQueues(): Promise<QuestionnaireInstanceQueue[]> {
    return this.http
      .get<{ queues: QuestionnaireInstanceQueue[] }>(
        this.apiUrl + 'probands/' + this.auth.currentUser.username + '/queues'
      )
      .pipe(pluck('queues'))
      .toPromise();
  }

  deleteQuestionnaireInstanceQueue(instance_id: number): Promise<void> {
    return this.http
      .delete<void>(
        this.apiUrl +
          'probands/' +
          this.auth.currentUser.username +
          '/queues/' +
          instance_id
      )
      .toPromise();
  }

  getImageBy(id): Promise<any> {
    return this.getFileBy(id);
  }

  getFileBy(id: any): Promise<any> {
    return this.http.get(this.apiUrl + 'files/' + id).toPromise();
  }

  getStudyWelcomeText(studyName: string): Promise<StudyWelcomeText> {
    return this.http
      .get<StudyWelcomeText>(
        this.apiUrl + 'studies/' + studyName + '/welcome-text'
      )
      .toPromise();
  }

  putStudyWelcomeText(studyName: string, welcomeText: string): Promise<any> {
    return this.http
      .put(this.apiUrl + 'studies/' + studyName + '/welcome-text', {
        welcome_text: welcomeText,
      })
      .toPromise();
  }
}
