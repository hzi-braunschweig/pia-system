/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { db } from '../db';
import { DbStudy, Study } from '../models/study';
import { EntityNotFoundError } from '../errors';
import pgPromise from 'pg-promise';
import QueryResultError = pgPromise.errors.QueryResultError;
import queryResultErrorCode = pgPromise.errors.queryResultErrorCode;

export class StudyRepository {
  public static async getStudy(studyName: string): Promise<Study> {
    try {
      return await db.one<DbStudy>(
        'SELECT * FROM studies WHERE name = $(name)',
        {
          name: studyName,
        }
      );
    } catch (err) {
      if (
        err instanceof QueryResultError &&
        err.code === queryResultErrorCode.noData
      )
        throw new EntityNotFoundError();
      else throw err;
    }
  }
}
