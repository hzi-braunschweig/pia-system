/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { ProbandOrigin } from '@pia-system/lib-http-clients-internal';

const createdAt = new TableColumn({
  name: 'created_at',
  type: 'timestamptz',
  isNullable: true,
  // We keep this null, so old entries won't automatically get the timestamp of
  // our migration. See AlterProbandCreatedAtOriginDefaultValue1666089544308,
  // which adds the current timestamp as the default value for new records.
  default: null,
});

const origin = new TableColumn({
  name: 'origin',
  type: 'enum',
  enumName: 'proband_origin',
  enum: [ProbandOrigin.SELF, ProbandOrigin.INVESTIGATOR, ProbandOrigin.SORMAS],
  // All rows until now have been created by investigators, so it is safe to set
  // this value for the first migration. AlterProbandCreatedAtOriginDefaultValue1666089544308
  // removes this default value to enforce new rows to set an origin.
  default: `'${ProbandOrigin.INVESTIGATOR}'`,
});

export class AddProbandCreatedAtOrigin1666003459920
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('probands', createdAt);
    await queryRunner.addColumn('probands', origin);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('probands', createdAt.name);
    await queryRunner.dropColumn('probands', origin.name);
  }
}
