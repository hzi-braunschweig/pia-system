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
import { TimeSpanUnit } from '../model/timeSpan';
import { FeedbackStatisticType } from '../entities/specificFeedbackStatistics';
import { FeedbackStatisticVisibility } from '../entities/feedbackStatisticConfiguration';

export class CreateFeedbackStatisticConfiguration1675778337508
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'feedback_statistic_configurations',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'serial',
          },
          {
            name: 'study',
            type: 'varchar',
          },
          {
            name: 'visibility',
            type: 'enum',
            enumName: 'feedback_statistic_visibility',
            enum: [
              FeedbackStatisticVisibility.HIDDEN,
              FeedbackStatisticVisibility.TESTPROBANDS,
              FeedbackStatisticVisibility.ALLAUDIENCES,
            ],
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'feedback_statistic_type',
            enum: [FeedbackStatisticType.RELATIVE_FREQUENCY_TIME_SERIES],
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
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'relative_frequency_time_series_configurations',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'serial',
          },
          {
            name: 'study',
            type: 'varchar',
          },
          {
            name: 'comparative_values_questionnaire_id',
            type: 'integer',
          },
          {
            name: 'comparative_values_questionnaire_version',
            type: 'integer',
          },
          {
            name: 'comparative_values_answer_option_value_codes_id',
            type: 'integer',
          },
          {
            name: 'comparative_values_answer_option_value_codes_variable_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'comparative_values_answer_option_value_codes_value_codes',
            type: 'integer[]',
          },
          {
            name: 'interval_shift_amount',
            type: 'integer',
          },
          {
            name: 'interval_shift_unit',
            type: 'enum',
            enumName: 'timespan_unit',
            enum: [
              TimeSpanUnit.HOUR,
              TimeSpanUnit.DAY,
              TimeSpanUnit.WEEK,
              TimeSpanUnit.MONTH,
            ],
          },
          {
            name: 'time_range_start_date',
            type: 'timestamptz',
          },
          {
            name: 'time_range_end_date',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'feedback_statistic_configurations',
          }),
        ],
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'feedback_statistic_time_serieses',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'serial',
          },
          {
            name: 'study',
            type: 'varchar',
          },
          {
            name: 'color',
            type: 'varchar',
          },
          {
            name: 'label',
            type: 'varchar',
          },
          {
            name: 'questionnaire_id',
            type: 'integer',
          },
          {
            name: 'questionnaire_version',
            type: 'integer',
          },

          {
            name: 'answer_option_value_codes_id',
            type: 'integer',
          },

          {
            name: 'answer_option_value_codes_variable_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'answer_option_value_codes_value_codes',
            type: 'integer[]',
          },
          {
            name: 'relative_frequency_time_series_configuration_id',
            type: 'serial',
          },
        ],

        foreignKeys: [
          new TableForeignKey({
            columnNames: ['relative_frequency_time_series_configuration_id'],
            referencedColumnNames: ['id'],
            referencedTableName:
              'relative_frequency_time_series_configurations',
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('feedback_statistic_time_serieses');
    await queryRunner.dropTable(
      'relative_frequency_time_series_configurations'
    );
    await queryRunner.dropTable('feedback_statistic_configurations');
  }
}
