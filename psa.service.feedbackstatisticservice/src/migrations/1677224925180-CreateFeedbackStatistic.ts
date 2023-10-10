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
import { FeedbackStatisticStatus } from '../entities/feedbackStatistic';

export class CreateFeedbackStatistic1677224925180
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'feedback_statistics',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'serial',
          },
          {
            name: 'configuration_id',
            type: 'serial',
          },
          {
            name: 'study',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'feedback_statistic_status',
            enum: [
              FeedbackStatisticStatus.ERROR,
              FeedbackStatisticStatus.HAS_DATA,
              FeedbackStatisticStatus.INSUFFICIENT_DATA,
              FeedbackStatisticStatus.PENDING,
            ],
          },
          {
            name: 'data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['configuration_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'feedback_statistic_configurations',
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('feedback_statistics');
  }
}
