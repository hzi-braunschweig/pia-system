/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertPseudonymsToLowercase1643882418846
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE follow_ups SET pseudonym = lower(pseudonym)'
    );
    await queryRunner.query(
      'UPDATE symptom_transmissions SET pseudonym = lower(pseudonym)'
    );
  }

  public async down(): Promise<void> {
    // conversion to lowercase cannot be reverted
    return Promise.resolve();
  }
}
