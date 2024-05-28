/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateConfiguration1713428094152 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'configuration',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'value',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      })
    );

    // setup default configuration
    await queryRunner.query(
      `INSERT INTO configuration (id, value) VALUES ('retentionTimeInDays', 'null')`
    );
    await queryRunner.query(
      `INSERT INTO configuration (id, value) VALUES ('active', 'false')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('configuration');
  }
}
