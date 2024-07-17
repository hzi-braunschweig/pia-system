/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNotificationLinkToOverview1718963386491
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'questionnaires',
      new TableColumn({
        name: 'notification_link_to_overview',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'questionnaires',
      'notification_link_to_overview'
    );
  }
}
