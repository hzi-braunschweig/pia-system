/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateLabResultTemplate1687426335432
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lab_result_templates',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'serial',
          },
          {
            name: 'study',
            isUnique: true,
            type: 'varchar',
          },
          {
            name: 'markdown_text',
            type: 'varchar',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['study'],
            referencedColumnNames: ['name'],
            referencedTableName: 'studies',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lab_result_templates');
  }
}
