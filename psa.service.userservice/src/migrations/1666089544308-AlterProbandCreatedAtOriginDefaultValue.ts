/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner } from 'typeorm';
import { ProbandOrigin } from '@pia-system/lib-http-clients-internal';

/**
 * We add the default value for probands.created_at later,
 * to keep null values for already created rows.
 * Only new rows should get a timestamp.
 *
 * We drop the default value for probands.origin later,
 * to enforce setting the origin, but initially set all
 * origins to investigator.
 */
export class AlterProbandCreatedAtOriginDefaultValue1666089544308
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<any> {
    return Promise.all([
      queryRunner.query(`
            ALTER TABLE probands 
            ALTER COLUMN created_at 
            SET DEFAULT current_timestamp;
        `),
      queryRunner.query(`
            ALTER TABLE probands 
            ALTER COLUMN origin 
            DROP DEFAULT;
        `),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return Promise.all([
      queryRunner.query(`
            ALTER TABLE probands 
            ALTER COLUMN created_at
            SET DEFAULT null;
        `),
      queryRunner.query(`
            ALTER TABLE probands 
            ALTER COLUMN origin 
            SET DEFAULT ${ProbandOrigin.INVESTIGATOR};
        `),
    ]);
  }
}
