/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';

import {
  Answer,
  AnswerPostRequest,
  FileDto,
  QuestionnaireInstance,
  QuestionnaireInstanceQueue,
  QuestionnaireStatus,
  Study,
  StudyWelcomeText,
} from './questionnaire.model';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/questionnaire/';
  }

  constructor(public http: HttpClient, private endpoint: EndpointService) {}

  deleteAnswer(
    questionnaireInstanceId: number,
    answerOptionId: number
  ): Promise<string> {
    return this.http
      .delete(
        this.getApiUrl() +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers/' +
          answerOptionId,
        { responseType: 'text' }
      )
      .toPromise();
  }

  getQuestionnaireInstances(
    status?: QuestionnaireStatus[]
  ): Promise<QuestionnaireInstance[]> {
    return this.http
      .get<{ questionnaireInstances: QuestionnaireInstance[]; links: any }>(
        this.getApiUrl() + 'questionnaireInstances',
        { params: { status } }
      )
      .pipe(pluck('questionnaireInstances'))
      .toPromise();
  }

  getQuestionnaireInstance(
    questionnaireInstanceId: number
  ): Promise<QuestionnaireInstance> {
    return this.http
      .get<QuestionnaireInstance>(
        this.getApiUrl() + 'questionnaireInstances/' + questionnaireInstanceId
      )
      .toPromise();
  }

  putQuestionnaireInstance(
    questionnaireInstanceId: number,
    putData: object
  ): Promise<QuestionnaireInstance> {
    return this.http
      .put<QuestionnaireInstance>(
        this.getApiUrl() + 'questionnaireInstances/' + questionnaireInstanceId,
        putData
      )
      .toPromise();
  }

  postAnswers(
    questionnaireInstanceId: number,
    data: AnswerPostRequest
  ): Promise<Answer[]> {
    return this.http
      .post<Answer[]>(
        this.getApiUrl() +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers',
        data
      )
      .toPromise();
  }

  getAnswers(questionnaireInstanceId: number): Promise<Answer[]> {
    return this.http
      .get<{ answers: Answer[]; links: any }>(
        this.getApiUrl() +
          'questionnaireInstances/' +
          questionnaireInstanceId +
          '/answers'
      )
      .pipe(pluck('answers'))
      .toPromise();
  }

  getStudy(name: string): Promise<Study> {
    return this.http
      .get<Study>(this.getApiUrl() + 'studies/' + name)
      .toPromise();
  }

  getStudyAddresses(): Promise<any> {
    return this.http.get(this.getApiUrl() + 'studies/addresses').toPromise();
  }

  getQuestionnaireInstanceQueues(
    username: string
  ): Promise<QuestionnaireInstanceQueue[]> {
    return this.http
      .get<{ queues: QuestionnaireInstanceQueue[] }>(
        this.getApiUrl() + 'probands/' + username + '/queues'
      )
      .pipe(pluck('queues'))
      .toPromise();
  }

  deleteQuestionnaireInstanceQueue(
    username: string,
    instanceId: number
  ): Promise<void> {
    return this.http
      .delete<void>(
        this.getApiUrl() + 'probands/' + username + '/queues/' + instanceId
      )
      .toPromise();
  }

  getFileById(id): Promise<FileDto> {
    return this.http.get<FileDto>(this.getApiUrl() + 'files/' + id).toPromise();
  }

  getStudyWelcomeText(studyName: string): Promise<StudyWelcomeText> {
    return this.http
      .get<StudyWelcomeText>(
        this.getApiUrl() + 'studies/' + studyName + '/welcome-text'
      )
      .toPromise();
  }
}
