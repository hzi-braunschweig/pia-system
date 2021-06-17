const dbModys = require('../dbModys');
const { config } = require('../config');
const personaldataserviceClient = require('../clients/personaldataserviceClient');
const userserviceClient = require('../clients/userserviceClient');

class ModysImportService {
  /**
   * @return {Promise<[]>}
   * @private
   */
  static async _fetchPersonalDataFromModys(pseudonyms) {
    if (!Array.isArray(pseudonyms) || pseudonyms.length === 0) return [];
    try {
      const modys = await dbModys.connectToModys();
      const queryPersonalData = `
                SELECT t_person.salutation       AS anrede,
                       t_person.title            AS titel,
                       t_person.name             AS name,
                       t_person.firstname        AS vorname,
                       t_address.street          AS strasse,
                       t_address.number          AS haus_nr,
                       t_address.zip             AS plz,
                       t_address.country         AS landkreis,
                       t_address.city            AS ort,
                       tel_priv.cd_value         AS telefon_privat,
                       tel_job.cd_value          AS telefon_dienst,
                       tel_mobile.cd_value       AS telefon_mobil,
                       email.cd_value            AS email,
                       t_person_identifier.value AS pseudonym
                FROM t_person
                         JOIN t_person_identifier ON t_person_identifier.fk_pid = t_person.pid
                         LEFT OUTER JOIN t_address ON pk_address = t_person.prim_addr_fk_address
                         LEFT OUTER JOIN t_contact_details AS tel_priv
                                         ON tel_priv.fk_pid = t_person.pid AND tel_priv.fk_cd_type_id = 1
                         LEFT OUTER JOIN t_contact_details AS tel_job
                                         ON tel_job.fk_pid = t_person.pid AND tel_job.fk_cd_type_id = 2
                         LEFT OUTER JOIN t_contact_details AS tel_mobile
                                         ON tel_mobile.fk_pid = t_person.pid AND tel_mobile.fk_cd_type_id = 3
                         LEFT OUTER JOIN t_contact_details AS email
                                         ON email.fk_pid = t_person.pid AND email.fk_cd_type_id = 5
                                         WHERE t_person_identifier.value IN (?)`;
      const probands = await modys.query(queryPersonalData, [pseudonyms]);
      dbModys.disconnectFromModys();
      return probands;
    } catch (e) {
      console.log('Error while fetching data from MODYS:', e);
      dbModys.disconnectFromModys();
      return [];
    }
  }

  static async updatePersonalData() {
    const pseudonyms = await userserviceClient
      .getPseudonyms(config.studyToImport, ['active', 'deactivation_pending'])
      .catch(() => console.log('Problems while connecting to userservice'));
    if (!pseudonyms) return;
    const probands = await this._fetchPersonalDataFromModys(pseudonyms);
    if (!probands || probands.length === 0) {
      console.log('Did not find any Participants in MODYS');
      return;
    }
    console.log('Got', probands.length, 'proband entries from MODYS');
    let successfullyImported = 0;
    let notImported = 0;
    let otherErrors = 0;
    for (const proband of probands) {
      try {
        await personaldataserviceClient.updatePersonalData(proband.pseudonym, {
          anrede: proband.anrede,
          titel: proband.titel,
          name: proband.name,
          vorname: proband.vorname,
          strasse: proband.strasse,
          haus_nr: proband.haus_nr,
          plz: proband.plz,
          landkreis: proband.landkreis,
          ort: proband.ort,
          telefon_privat: proband.telefon_privat,
          telefon_dienst: proband.telefon_dienst,
          telefon_mobil: proband.telefon_mobil,
          email: proband.email,
        });
        successfullyImported++;
      } catch (e) {
        if (e.output.statusCode === 404) {
          notImported++;
        } else {
          console.log('Could not update the personal data.', e);
          otherErrors++;
        }
      }
    }
    console.log(
      successfullyImported,
      'entries have been successfully imported.'
    );
    console.log(
      notImported,
      'entries could not be imported, because the proband could not be found in pia.'
    );
    console.log(
      otherErrors,
      'other entries could not be imported with no known reason.'
    );
  }
}

module.exports = ModysImportService;
