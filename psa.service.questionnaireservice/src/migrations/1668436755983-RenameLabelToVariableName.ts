/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameLabelToVariableName1668436755983
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE questions
            RENAME COLUMN label
                TO variable_name;
    `);
    await queryRunner.query(`
        ALTER TABLE answer_options
            RENAME COLUMN label
                TO variable_name;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE questions
            RENAME COLUMN variable_name
                TO label;
    `);
    await queryRunner.query(`
        ALTER TABLE answer_options
            RENAME COLUMN variable_name
                TO label;
    `);
  }
}
