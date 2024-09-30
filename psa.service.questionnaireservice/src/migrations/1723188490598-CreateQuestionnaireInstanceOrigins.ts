/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateQuestionnaireInstanceOrigins1723188490598
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'questionnaire_instance_origins',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'created_instance_id',
            type: 'integer',
            isUnique: true,
          },
          {
            name: 'origin_instance_id',
            type: 'integer',
          },
          {
            name: 'condition_id',
            type: 'integer',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );

    await queryRunner.createForeignKeys('questionnaire_instance_origins', [
      new TableForeignKey({
        columnNames: ['created_instance_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questionnaire_instances',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['origin_instance_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questionnaire_instances',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'questionnaire_instance_origins',
      new TableIndex({
        name: 'questionnaire_instances_origin_created_idx',
        columnNames: ['origin_instance_id', 'created_instance_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('questionnaire_instance_origins');
  }
}
