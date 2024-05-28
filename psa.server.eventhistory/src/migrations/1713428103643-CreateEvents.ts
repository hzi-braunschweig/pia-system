/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEvents1713428103643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'study_name',
            type: 'varchar',
          },
          {
            name: 'timestamp',
            type: 'timestamptz',
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
        ],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'events_study_name_idx',
        columnNames: ['type', 'study_name', 'timestamp'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('events');
  }
}
