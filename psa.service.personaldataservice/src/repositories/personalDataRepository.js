const { getDbTransactionFromOptionsOrDbConnection } = require('../db');

class PersonalDataRepository {
  static async deletePersonalData(pseudonym, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);

    await db.none('DELETE FROM personal_data WHERE pseudonym = $(pseudonym)', {
      pseudonym,
    });
  }

  static async getPersonalData(pseudonym, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.oneOrNone(
      'SELECT * FROM personal_data WHERE pseudonym=$1',
      [pseudonym]
    );
  }

  static async getPersonalDataEmail(pseudonym, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db
      .oneOrNone('SELECT email FROM personal_data WHERE pseudonym=$1', [
        pseudonym,
      ])
      .then((row) => row?.email);
  }

  static async getPersonalDataOfStudies(studies, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    if (!studies?.length) return [];
    return await db.manyOrNone(
      'SELECT * FROM personal_data WHERE study IN ($(studies:csv))',
      { studies }
    );
  }

  static async updatePersonalData(pseudonym, userValues, options) {
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

  static async createPersonalData(pseudonym, study, userValues, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.one(
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

module.exports = PersonalDataRepository;
