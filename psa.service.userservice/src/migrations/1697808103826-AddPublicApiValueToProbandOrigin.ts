/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicApiValueToProbandOrigin1697808103826
  implements MigrationInterface
{
  /**
   * As there is no way to rename an enum value in postgres, we have to create a new enum type.
   * In order to stay with the same name, we first have to delete and replace the old type with
   * a temporary one and then create the new one with the same name as before.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a new enum type and replace the old one
    await queryRunner.query(
      "CREATE TYPE proband_origin_old AS ENUM ('self', 'investigator', 'sormas')"
    );
    await queryRunner.query(
      'ALTER TABLE probands ALTER COLUMN origin TYPE proband_origin_old USING origin::text::proband_origin_old'
    );
    await queryRunner.query('DROP TYPE proband_origin');

    // Create the new enum type
    await queryRunner.query(
      "CREATE TYPE proband_origin AS ENUM ('self', 'investigator', 'sormas', 'public_api')"
    );
    await queryRunner.query(
      'ALTER TABLE probands ALTER COLUMN origin TYPE proband_origin USING origin::text::proband_origin'
    );
    await queryRunner.query('DROP TYPE proband_origin_old');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the original enum type and revert the column type changes
    await queryRunner.query(
      "CREATE TYPE proband_origin_old AS ENUM ('self', 'investigator', 'sormas', 'public_api')"
    );
    await queryRunner.query(
      'ALTER TABLE probands ALTER COLUMN origin TYPE proband_origin_old USING origin::text::proband_origin_old'
    );
    await queryRunner.query('DROP TYPE proband_origin');

    // Recreate the new enum type if it existed before the migration
    await queryRunner.query(
      "CREATE TYPE proband_origin AS ENUM ('self', 'investigator', 'sormas')"
    );
    await queryRunner.query(
      'ALTER TABLE probands ALTER COLUMN origin TYPE proband_origin USING origin::text::proband_origin'
    );
    await queryRunner.query('DROP TYPE proband_origin_old');
  }
}
