/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ITask } from 'pg-promise';
import { Questionnaire } from '../models/questionnaire';

export class QuestionnaireService {
  public static async getQuestionnaire(
    t: ITask<unknown>,
    id: number,
    version: number
  ): Promise<Questionnaire> {
    return t.one('SELECT * FROM questionnaires WHERE id=$1 AND version=$2', [
      id,
      version,
    ]);
  }
}
