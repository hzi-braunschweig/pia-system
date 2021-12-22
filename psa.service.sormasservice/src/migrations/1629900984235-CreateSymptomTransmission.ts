/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSymptomTransmission1629900984235
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'symptom_transmissions',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'serial',
          },
          {
            name: 'pseudonym',
            type: 'varchar',
          },
          {
            name: 'study',
            type: 'varchar',
          },
          {
            name: 'questionnaire_instance_id',
            type: 'integer',
          },
          {
            name: 'version',
            type: 'integer',
          },
          {
            name: 'transmission_date',
            type: 'timestamptz',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [{ columnNames: ['pseudonym'] }],
        uniques: [{ columnNames: ['questionnaire_instance_id', 'version'] }],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('symptom_transmissions');
  }
}
