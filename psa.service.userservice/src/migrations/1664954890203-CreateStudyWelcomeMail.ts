/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateStudyWelcomeMail1664954890203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'study_welcome_mails',
        columns: [
          {
            name: 'study_name',
            type: 'text',
            isPrimary: true,
          },
          {
            name: 'subject',
            type: 'text',
          },
          {
            name: 'markdown_text',
            type: 'text',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['study_name'],
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
    await queryRunner.dropTable('study_welcome_mails');
  }
}
