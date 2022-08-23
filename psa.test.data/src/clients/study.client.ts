/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fetch from '../utils/fetch.util';
import chalk from 'chalk';

import { UserClient } from './user.client';
import { RandomDataService } from '../services/random-data.service';
import { Study } from '../models/study.model';

export class StudyClient {
  constructor(
    private readonly baseUrl: string,
    private readonly adminBaseUrl: string,
    private readonly userClient: UserClient
  ) {}

  public async createStudy(
    study: Study,
    disableFourEyesOpposition = false
  ): Promise<string> {
    const response = await fetch(this.adminBaseUrl + '/user/studies', {
      method: 'post',
      body: JSON.stringify(study),
      headers: {
        Authorization: await this.userClient.getAdminToken(),
        'Content-Type': 'application/json',
      },
    });
    const body = (await response?.json()) as { name: string };

    console.log(chalk.blue(`StudyClient: created study: ${body.name}`));

    if (disableFourEyesOpposition) {
      await this.disableFourEyesOpposition(body.name);
    }
    return body.name;
  }

  public async disableFourEyesOpposition(studyId: string): Promise<void> {
    const forscherCredentials = await this.userClient.createProfessionalUser(
      RandomDataService.getRandomProfessionalUser('Forscher', studyId)
    );

    const confirmingForscherCredentials =
      await this.userClient.createProfessionalUser(
        RandomDataService.getRandomProfessionalUser('Forscher', studyId)
      );

    const forscherLogin = await this.userClient.getRefreshableToken(
      forscherCredentials
    );

    const response = await fetch(
      this.baseUrl + '/user/admin/pendingstudychanges',
      {
        method: 'POST',
        body: JSON.stringify({
          requested_for: confirmingForscherCredentials.username,
          study_id: studyId,
          has_four_eyes_opposition_to: false,
        }),
        headers: {
          Authorization: await forscherLogin(),
        },
      }
    );
    const temp = await response?.json();
    const { id } = temp as { id: string };

    const confirmingForscherLogin = await this.userClient.getRefreshableToken(
      confirmingForscherCredentials
    );

    await fetch(`${this.baseUrl}/user/admin/pendingstudychanges/${id}`, {
      method: 'put',
      headers: {
        Authorization: await confirmingForscherLogin(),
      },
    });
  }
}
