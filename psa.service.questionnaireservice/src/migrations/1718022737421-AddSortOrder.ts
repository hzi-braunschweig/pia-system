/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddSortOrder1718022737421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'questionnaires',
      new TableColumn({
        name: 'sort_order',
        type: 'smallint',
        isNullable: true,
        default: null,
      })
    );

    await queryRunner.createIndex(
      'questionnaires',
      new TableIndex({
        name: 'questionnaires_sort_order_idx',
        columnNames: ['study_id', 'sort_order'],
      })
    );

    await queryRunner.addColumn(
      'questionnaire_instances',
      new TableColumn({
        name: 'sort_order',
        type: 'smallint',
        isNullable: true,
        default: null,
      })
    );

    await queryRunner.createIndex(
      'questionnaire_instances',
      new TableIndex({
        name: 'questionnaire_instances_sort_order_idx',
        columnNames: ['study_id', 'user_id', 'sort_order'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('questionnaires', 'sort_order');
    await queryRunner.dropColumn('questionnaire_instances', 'sort_order');
    await queryRunner.dropIndex(
      'questionnaires',
      'questionnaires_sort_order_idx'
    );
    await queryRunner.dropIndex(
      'questionnaire_instances',
      'questionnaire_instances_sort_order_idx'
    );
  }
}
