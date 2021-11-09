/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { RepositoryOptions } from '@pia/lib-service-core';
import { PersonalData, PersonalDataReq } from '../models/personalData';

export class PersonalDataRepository {
  public static async deletePersonalData(
    pseudonym: string,
    options?: RepositoryOptions
  ): Promise<void> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);

    await db.none('DELETE FROM personal_data WHERE pseudonym = $(pseudonym)', {
      pseudonym,
    });
  }

  public static async getPersonalData(
    pseudonym: string,
    options?: RepositoryOptions
  ): Promise<PersonalData | null> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.oneOrNone<PersonalData>(
      'SELECT * FROM personal_data WHERE pseudonym=$1',
      [pseudonym]
    );
  }

  public static async getPersonalDataEmail(
    pseudonym: string,
    options?: RepositoryOptions
  ): Promise<string | null> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db
      .oneOrNone<PersonalData>(
        'SELECT email FROM personal_data WHERE pseudonym=$1',
        [pseudonym]
      )
      .then((row) => row?.email ?? null);
  }

  public static async getPersonalDataOfStudies(
    studies: string[] | undefined,
    options?: RepositoryOptions
  ): Promise<PersonalData[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    if (!studies?.length) return [];
    return await db.manyOrNone<PersonalData>(
      'SELECT * FROM personal_data WHERE study IN ($(studies:csv))',
      { studies }
    );
  }

  public static async updatePersonalData(
    pseudonym: string,
    userValues: PersonalDataReq,
    options?: RepositoryOptions
  ): Promise<PersonalData> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      `UPDATE personal_data
             SET anrede=$(anrede),
                 titel=$(titel),
                 name=$(name),
                 vorname=$(vorname),
                 strasse=$(strasse),
                 haus_nr=$(haus_nr),
                 plz=$(plz),
                 landkreis=$(landkreis),
                 ort=$(ort),
                 telefon_privat=$(telefon_privat),
                 telefon_dienst=$(telefon_dienst),
                 telefon_mobil=$(telefon_mobil),
                 email=$(email),
                 comment=$(comment)
             WHERE pseudonym = $(pseudonym)
             RETURNING * `,
      {
        anrede: userValues.anrede,
        titel: userValues.titel,
        name: userValues.name,
        vorname: userValues.vorname,
        strasse: userValues.strasse,
        haus_nr: userValues.haus_nr,
        plz: userValues.plz,
        landkreis: userValues.landkreis,
        ort: userValues.ort,
        telefon_privat: userValues.telefon_privat,
        telefon_dienst: userValues.telefon_dienst,
        telefon_mobil: userValues.telefon_mobil,
        email: userValues.email,
        comment: userValues.comment,
        pseudonym: pseudonym,
      }
    );
  }

  public static async createPersonalData(
    pseudonym: string,
    study: string,
    userValues: PersonalDataReq,
    options?: RepositoryOptions
  ): Promise<PersonalData> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.one<PersonalData>(
      `INSERT INTO personal_data(pseudonym, study, anrede, titel, name, vorname, strasse, haus_nr, plz, landkreis,
                                       ort,
                                       telefon_privat, telefon_dienst, telefon_mobil, email, comment)
             VALUES ($(pseudonym), $(study), $(anrede), $(titel), $(name), $(vorname), $(strasse), $(haus_nr), $(plz),
                     $(landkreis), $(ort), $(telefon_privat), $(telefon_dienst), $(telefon_mobil), $(email), $(comment))
             RETURNING * `,
      {
        pseudonym: pseudonym,
        study: study,
        anrede: userValues.anrede,
        titel: userValues.titel,
        name: userValues.name,
        vorname: userValues.vorname,
        strasse: userValues.strasse,
        haus_nr: userValues.haus_nr,
        plz: userValues.plz,
        landkreis: userValues.landkreis,
        ort: userValues.ort,
        telefon_privat: userValues.telefon_privat,
        telefon_dienst: userValues.telefon_dienst,
        telefon_mobil: userValues.telefon_mobil,
        email: userValues.email,
        comment: userValues.comment,
      }
    );
  }
}
