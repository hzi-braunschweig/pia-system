/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MigrationInterface,
  QueryRunner,
  TableCheck,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddCustomName1705593083327 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'questionnaires',
      new TableColumn({
        name: 'custom_name',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.createIndex(
      'questionnaires',
      new TableIndex({
        name: 'custom_name_idx',
        columnNames: ['study_id', 'custom_name'],
      })
    );

    await queryRunner.query(`
      CREATE FUNCTION 
        public.check_custom_name_in_use(p_study_id text, p_id integer, p_custom_name text) 
      RETURNS boolean LANGUAGE PLPGSQL AS
      $$BEGIN
        IF p_custom_name is null THEN RETURN false; END IF;
        RETURN (
          SELECT EXISTS (
            SELECT 1
            FROM questionnaires
            WHERE study_id = p_study_id AND id <> p_id AND custom_name = p_custom_name
          )
        );
      END;$$;
    `);

    await queryRunner.createCheckConstraint(
      'questionnaires',
      new TableCheck({
        name: 'unique_custom_name',
        expression:
          'NOT (public.check_custom_name_in_use(study_id, id, custom_name))',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('questionnaires', 'custom_name_idx');
    await queryRunner.dropColumn('questionnaires', 'custom_name');
    await queryRunner.dropCheckConstraint(
      'questionnaires',
      'unique_custom_name'
    );
    await queryRunner.query(
      'DROP FUNCTION public.check_custom_name_in_use(p_study_id text, p_id integer, p_version integer,  p_custom_name text);'
    );
  }
}
