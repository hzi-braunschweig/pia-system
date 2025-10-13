/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { StudyWelcomeText } from 'src/app/psa.app.core/models/studyWelcomeText';
import { Answer } from '../../models/answer';
import {
  Questionnaire,
  QuestionnaireListResponse,
} from '../../models/questionnaire';
import {
  PublishMode,
  QuestionnaireFile,
  QuestionnaireImportResponseBody,
} from '../../models/questionnaireImport';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceResponse,
  QuestionnaireStatus,
} from '../../models/questionnaireInstance';
import { QuestionnaireInstanceQueue } from '../../models/questionnaireInstanceQueue';
import { Study } from '../../models/study';
import { StudyAddress } from '../../models/studyAddress';
import { ExportRequestData } from '../../models/export';

@Injectable()
export class QuestionnaireService {
  private static readonly questionnaireInstanceDateConverter = map(
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

  constructor(private readonly http: HttpClient) {}

  async getQuestionnaire(
    questionnaireId: number,
    version: number
  ): Promise<Questionnaire> {
    return this.http
      .get<Questionnaire>(
        this.apiUrl + 'questionnaires/' + questionnaireId + '/' + version
      )
      .toPromise();
  }

  async deleteQuestionnaire(
    questionnaireId: number,
    version: number
  ): Promise<void> {
    return this.http
      .delete<void>(
        this.apiUrl + 'questionnaires/' + questionnaireId + '/' + version
      )
      .toPromise();
  }

  async deleteAnswer(
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

  async getQuestionnaires(): Promise<QuestionnaireListResponse> {
    return this.http
      .get<QuestionnaireListResponse>(this.apiUrl + 'questionnaires')
      .toPromise();
  }

  public async importQuestionnaire(
    study: string,
    publishMode: PublishMode,
    questionnaireFiles: QuestionnaireFile[]
  ): Promise<QuestionnaireImportResponseBody> {
    return firstValueFrom(
      this.http.post<QuestionnaireImportResponseBody>(
        this.apiUrl + 'studies/' + study + '/questionnaires-import',
        {
          publishMode,
          questionnaireFiles,
        }
      )
    );
  }

  async postQuestionnaire(postData: object): Promise<any> {
    return this.http
      .post<any>(this.apiUrl + 'questionnaires', postData)
      .toPromise();
  }

  async putQuestionnaire(
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
  async deactivateQuestionnaire(
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

  async reviseQuestionnaire(
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

  async getQuestionnaireInstancesForUser(
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

  async getQuestionnaireInstances(
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

  async getQuestionnaireInstance(
    questionnaireInstanceId: number
  ): Promise<QuestionnaireInstance> {
    return this.http
      .get<QuestionnaireInstance>(
        this.apiUrl + 'questionnaireInstances/' + questionnaireInstanceId
      )
      .toPromise();
  }

  async putQuestionnaireInstance(
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

  async postAnswers(
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

  async getAnswers(
    questionnaireInstanceId: number
  ): Promise<{ answers: Answer[] }> {
    return this.http
      .get<{ answers: Answer[] }>(
        this.apiUrl +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers'
      )
      .toPromise();
  }

  async getHistoricalAnswers(
    questionnaireInstanceId: number
  ): Promise<Answer[]> {
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

  /**
   * @deprecated remaining study API routes will be moved to the userservice in the future
   * @see https://confluence.sormas-tools.de/pages/viewpage.action?pageId=12978804
   */
  async getStudy(name: string): Promise<Study> {
    return this.http.get<Study>(this.apiUrl + 'studies/' + name).toPromise();
  }

  /**
   * @deprecated remaining study API routes will be moved to the userservice in the future
   * @see https://confluence.sormas-tools.de/pages/viewpage.action?pageId=12978804
   */
  async getStudyAddresses(): Promise<StudyAddress[]> {
    return this.http
      .get<StudyAddress[]>(this.apiUrl + 'studies/addresses')
      .toPromise();
  }

  getQuestionnaireInstanceQueues(
    pseudonym: string
  ): Observable<QuestionnaireInstanceQueue[]> {
    return this.http
      .get<{ queues: QuestionnaireInstanceQueue[] }>(
        this.apiUrl + 'probands/' + pseudonym + '/queues'
      )
      .pipe(map((response) => response.queues));
  }

  async deleteQuestionnaireInstanceQueue(
    instance_id: number,
    pseudonym: string
  ): Promise<void> {
    return this.http
      .delete<void>(
        this.apiUrl + 'probands/' + pseudonym + '/queues/' + instance_id
      )
      .toPromise();
  }

  async getImageBy(id): Promise<any> {
    return this.getFileBy(id);
  }

  async getFileBy(id: any): Promise<any> {
    return this.http.get(this.apiUrl + 'files/' + id).toPromise();
  }

  /**
   * @deprecated remaining study API routes will be moved to the userservice in the future
   * @see https://confluence.sormas-tools.de/pages/viewpage.action?pageId=12978804
   */
  async getStudyWelcomeText(studyName: string): Promise<StudyWelcomeText> {
    return this.http
      .get<StudyWelcomeText>(
        this.apiUrl + 'studies/' + studyName + '/welcome-text'
      )
      .toPromise();
  }

  export(exportRequestData: ExportRequestData, token: string) {
    // convert dates to utc string to prevent timezone issues
    const convertedData = this.convertExportDates(exportRequestData);
    // we use a hidden form for the post to let the browser handle the streaming of the response
    // to prevent the browser from keeping the whole response into memory before writing it to the disc
    this.createFormWithDataAndSubmit(convertedData, token);
  }

  private convertExportDates(
    exportRequestData: ExportRequestData
  ): ExportRequestData {
    if (exportRequestData.start_date) {
      exportRequestData.start_date =
        exportRequestData.start_date.toDateString();
    }
    if (exportRequestData.end_date) {
      exportRequestData.end_date = exportRequestData.end_date.toDateString();
    }
    return exportRequestData;
  }

  private createFormWithDataAndSubmit(
    exportRequestData: Record<string, any>,
    token: string
  ) {
    const form = document.createElement('form');
    form.action = 'api/v1/questionnaire/export';
    form.method = 'post';
    form.style.display = 'none';
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    const optionsInput = document.createElement('input');
    optionsInput.type = 'hidden';
    optionsInput.name = 'exportOptions';
    optionsInput.value = JSON.stringify(exportRequestData);
    form.appendChild(tokenInput);
    form.appendChild(optionsInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }
}
