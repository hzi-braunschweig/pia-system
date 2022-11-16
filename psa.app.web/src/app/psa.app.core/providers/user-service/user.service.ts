/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AccessLevel, StudyAccess } from '../../models/studyAccess';
import { ProfessionalAccount } from '../../models/professionalAccount';
import { ProfessionalRole } from '../../models/user';
import { Study } from '../../models/study';
import { StudyWelcomeText } from '../../models/studyWelcomeText';
import {
  StudyWelcomeMailTemplateRequestDto,
  StudyWelcomeMailTemplateResponseDto,
} from '../../models/studyWelcomeMail';

export interface GetProfessionalAccountsFilters {
  studyName?: string;
  role?: ProfessionalRole;
  accessLevel?: AccessLevel;
  onlyMailAddresses?: boolean;
  filterSelf?: boolean;
}

@Injectable()
export class UserService {
  private readonly apiUrl = 'api/v1/user';

  constructor(private http: HttpClient) {}

  public async getStudyAccesses(studyName: string): Promise<StudyAccess[]> {
    return await this.http
      .get<StudyAccess[]>(`${this.apiUrl}/studies/${studyName}/accesses`)
      .toPromise();
  }

  public async deleteUserFromStudy(
    username: string,
    studyName: string
  ): Promise<void> {
    return await this.http
      .delete<void>(`${this.apiUrl}/studies/${studyName}/accesses/${username}`)
      .toPromise();
  }

  public async postStudyAccess(studyAccess: StudyAccess): Promise<StudyAccess> {
    return await this.http
      .post<StudyAccess>(
        `${this.apiUrl}/studies/${studyAccess.studyName}/accesses`,
        studyAccess
      )
      .toPromise();
  }

  public async putStudyAccess(studyAccess: StudyAccess): Promise<StudyAccess> {
    return await this.http
      .put<StudyAccess>(
        `${this.apiUrl}/studies/${studyAccess.studyName}/accesses/${studyAccess.username}`,
        studyAccess
      )
      .toPromise();
  }

  public async getProfessionalAccounts(
    filter: GetProfessionalAccountsFilters
  ): Promise<ProfessionalAccount[]> {
    const params = new HttpParams({
      fromObject: { ...filter },
    });
    return await this.http
      .get<ProfessionalAccount[]>(`${this.apiUrl}/accounts`, { params })
      .toPromise();
  }

  getStudies(): Promise<Study[]> {
    return this.http.get<Study[]>(`${this.apiUrl}/studies`).toPromise();
  }

  postStudy(postData: object): Promise<Study> {
    return this.http
      .post<Study>(`${this.apiUrl}/studies`, postData)
      .toPromise();
  }

  putStudy(name: string, putData: object): Promise<Study> {
    return this.http
      .put<Study>(`${this.apiUrl}/studies/${name}`, putData)
      .toPromise();
  }

  getStudy(name: string): Promise<Study> {
    return this.http.get<Study>(`${this.apiUrl}/studies/${name}`).toPromise();
  }

  getStudyWelcomeText(studyName: string): Promise<StudyWelcomeText> {
    return this.http
      .get<StudyWelcomeText>(`${this.apiUrl}/studies/${studyName}/welcome-text`)
      .toPromise();
  }

  putStudyWelcomeText(
    studyName: string,
    welcomeText: string
  ): Promise<StudyWelcomeText> {
    return this.http
      .put<StudyWelcomeText>(
        `${this.apiUrl}/studies/${studyName}/welcome-text`,
        {
          welcome_text: welcomeText,
        }
      )
      .toPromise();
  }

  getStudyWelcomeMail(
    studyName: string
  ): Promise<StudyWelcomeMailTemplateResponseDto> {
    return this.http
      .get<StudyWelcomeMailTemplateResponseDto>(
        `${this.apiUrl}/studies/${studyName}/welcome-mail`
      )
      .toPromise();
  }

  putStudyWelcomeMail(
    studyName: string,
    welcomeMail: StudyWelcomeMailTemplateRequestDto
  ): Promise<StudyWelcomeMailTemplateResponseDto> {
    return this.http
      .put<StudyWelcomeMailTemplateResponseDto>(
        `${this.apiUrl}/studies/${studyName}/welcome-mail`,
        welcomeMail
      )
      .toPromise();
  }
}
