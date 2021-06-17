const format = require('date-fns/format');
const Boom = require('@hapi/boom');
const CsvSanatizer = require('../services/csvSanatizer');

const { Transform } = require('stream');
const stringify = require('csv-stringify');
const archiver = require('archiver');

const searchesInteractor = (function () {
  /**
   * It removes all malicious characters in a string or every value of an object or array
   * @param value {unknown}
   */
  function preventCsvInjection(value) {
    if (Array.isArray(value)) {
      return value.map((value) => preventCsvInjection(value));
    } else if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, value]) => [
          key,
          preventCsvInjection(value),
        ])
      );
    } else if (typeof value === 'string') {
      return CsvSanatizer.removeMaliciousChars(value);
    } else {
      return value;
    }
  }

  /**
   * Formats a date
   * @param date {Date} the date to be formatted
   * @return {string} the formated date time string
   */
  function formatDate(date) {
    if (date instanceof Date) {
      return format(date, 'dd.MM.yyyy HH:mm');
    } else {
      return '.';
    }
  }

  /**
   * Creates a transform stream wich receives a object and pushes a transformed object.
   * @param transform {function} the function, that receives the object and returns the transformed object.
   * @return {module:stream.internal.Transform} the transform stream
   */
  function createTransformStream(transform) {
    return new Transform({
      writableObjectMode: true,
      readableObjectMode: true,
      transform(chunk, encoding, callback) {
        const result = preventCsvInjection(transform(chunk));
        if (result) {
          this.push(result);
        }
        callback();
      },
    });
  }

  /**
   * returns a transform function, that transforms a answer into a csv answer line object.
   * @param fileIDs {string[]} An array where the file IDs can be collected. Usually this is an empty array.
   * This is needed to offer it to every call of the transform function.
   * @return {function(*): (undefined|{Antwort: string|*, Proband: *, Kodierung_Code: *, FB_Datum: *, Antwort_Datum: *, Kodierung_Wert: *, Auffälig_Wert: *, Frage: string})}
   */
  function getTransformAnswers(fileIDs) {
    return function transformAnswers(answer) {
      if (
        (answer.a_type === 8 || answer.a_type === 10) &&
        answer.value &&
        fileIDs.indexOf(answer.value) === -1
      ) {
        fileIDs.push(answer.value);
      }

      if (answer.a_type === 5 && answer.value) {
        try {
          answer.value = format(new Date(answer.value), 'dd.MM.yyyy');
        } catch (err) {
          console.error('Could not parse/format Date', answer.value, err);
        }
      }

      if (answer.versioning === 2 && answer.status === 'released_once') {
        // these answers were made by the proband after releasing the questionnaire instance for the first time,
        // but he has not yet released them a second time, so they are not relevant for the researchers
        return;
      }
      let antwort_datum;
      switch (answer.status) {
        case 'released_once':
          antwort_datum = formatDate(answer.date_of_release_v1);
          break;
        case 'released_twice':
          antwort_datum = formatDate(answer.date_of_release_v2);
          break;
        case 'released':
          antwort_datum = formatDate(answer.date_of_release);
          break;
        default:
          antwort_datum = '.';
          break;
      }

      return {
        Frage:
          answer.questionnaire_name +
          '_v' +
          answer.questionnaire_version +
          '_' +
          (answer.question_label
            ? answer.question_label
            : 'f' + answer.qposition) +
          '_' +
          (answer.answer_option_label
            ? answer.answer_option_label
            : answer.aposition) +
          (answer.versioning ? '_a' + answer.versioning : ''),
        Proband: answer.user_id,
        FB_Datum: formatDate(answer.date_of_issue),
        Antwort_Datum: antwort_datum,
        Antwort: answer.value
          ? answer.status === 'deleted'
            ? 'gelöscht'
            : answer.status === 'expired'
            ? 'abgelaufen'
            : answer.value
          : '.',
        Kodierung_Code: answer.values_code,
        Kodierung_Wert: answer.values,
      };
    };
  }

  /**
   * A transform function, that transforms a observation into a csv lab result line object.
   * @param observation
   * @return {{PCR_ID: *, Kommentar: (string|boolean|Comment|string|String), Auftragsnr: *, Bericht_ID: *, Proband: *, Datum_Mitteilung: string, Datum_Abnahme: string, Arzt: (*|string), Datum_Eingang: string, Datum_Analyse: string, 'CT-Wert': (*|string), Ergebnis: *, PCR: *}}
   */
  function transformLabResult(observation) {
    return {
      Bericht_ID: observation.lab_result_id,
      Proband: observation.user_id,
      Datum_Abnahme: formatDate(observation.date_of_sampling),
      Datum_Eingang: formatDate(observation.date_of_delivery),
      Datum_Analyse: formatDate(observation.date_of_analysis),
      Datum_Mitteilung: formatDate(observation.date_of_announcement),
      PCR: observation.name,
      PCR_ID: observation.name_id,
      Ergebnis: observation.result_string,
      'CT-Wert': observation.result_value ? observation.result_value : '.',
      Auftragsnr: observation.order_id,
      Arzt: observation.performing_doctor ? observation.performing_doctor : '.',
      Kommentar: observation.comment,
    };
  }

  /**
   * A transform function, that transforms a sample into a csv sample line object.
   * @param sample
   * @return {{Status: string, Proben_ID: *, Proband: *, Bakt_Proben_ID: (*|string), Bemerkung: (*|string)}}
   */
  function transformSample(sample) {
    let status = '';
    if (sample.study_status === 'deleted') {
      status = 'gelöscht';
    } else {
      if (sample.status === 'analyzed') status = 'analysiert';
      else if (sample.status === 'new') status = 'neu';
      else if (sample.status === 'sampled') status = 'genommen';
    }
    return {
      Proben_ID: sample.id,
      Bakt_Proben_ID: sample.dummy_sample_id ? sample.dummy_sample_id : '.',
      Proband: sample.user_id,
      Status: status,
      Bemerkung: sample.remark ? sample.remark : '.',
    };
  }

  /**
   * A transform function, that transforms a blood sample into a csv blood sample line object.
   * @param sample
   * @return {{Status: (string), Proband: *, Blutproben_ID: *, Bemerkung: (*|string)}}
   */
  function transformBloodSample(sample) {
    return {
      Blutproben_ID: sample.sample_id,
      Proband: sample.user_id,
      Status: sample.blood_sample_carried_out ? 'genommen' : 'nicht genommen',
      Bemerkung: sample.remark ? sample.remark : '.',
    };
  }

  /**
   * A transform function, that transforms a users setting into a csv setting line object.
   * @param setting
   * @return {{Proband: *, Testproband: (string), 'Einwilligung Probenentnahme': (string), 'Einwilligung Blutprobenentnahme': (string), 'Benachrichtigung Uhrzeit': (*|string), 'Einwilligung Ergebnismitteilung': (string)}}
   */
  function transformSettings(setting) {
    return {
      Proband: setting.username,
      'Benachrichtigung Uhrzeit':
        setting.notification_time != null ? setting.notification_time : '',
      'Einwilligung Ergebnismitteilung':
        setting.compliance_labresults === true ? 'Ja' : 'Nein',
      'Einwilligung Probenentnahme':
        setting.compliance_samples === true ? 'Ja' : 'Nein',
      'Einwilligung Blutprobenentnahme':
        setting.compliance_bloodsamples === true ? 'Ja' : 'Nein',
      Testproband: setting.is_test_proband === true ? 'Ja' : 'Nein',
    };
  }

  /**
   * Searches for the given data and resolves the result in a zip as a readable stream.
   * @param searchCriteria
   * @param pgHelper
   * @return {Promise<stream.Readable>}
   */
  async function search(searchCriteria, pgHelper) {
    const start_date = searchCriteria.start_date
      ? new Date(searchCriteria.start_date)
      : new Date(0);
    const end_date = searchCriteria.end_date
      ? new Date(searchCriteria.end_date)
      : new Date();

    const {
      study_name,
      questionnaires,
      probands,

      exportAnswers,
      exportLabResults,
      exportSamples,
      exportSettings,
    } = searchCriteria;

    // Keep the interface compatible to the existing frontend,
    // but use these aliases for a more uniform and future proof code body.
    const exportFiles = true;
    const exportBloodSamples = exportSamples;

    if (exportAnswers && (!questionnaires || questionnaires.length === 0)) {
      throw Boom.badData('Unable to export answers without questionnaires.');
    }

    let foundProbands;
    try {
      foundProbands = await pgHelper.findProbandNamesInStudy(
        probands,
        study_name
      );
    } catch (err) {
      console.log(err);
      throw Boom.internal('Something went wrong while connecting to the db.');
    }

    if (!foundProbands || foundProbands.length === 0) {
      throw Boom.badData('There was no Proband found.');
    }

    const archive = archiver('zip');

    if (exportAnswers) {
      const fileIDs = [];
      const answersStream = pgHelper.streamAnswers(
        questionnaires,
        foundProbands,
        start_date,
        end_date,
        study_name
      );
      const transformStream = createTransformStream(
        getTransformAnswers(fileIDs)
      );
      const csvStream = stringify({ header: true });
      archive.append(answersStream.pipe(transformStream).pipe(csvStream), {
        name: 'answers.csv',
      });

      if (exportFiles) {
        transformStream.on('end', async () => {
          if (fileIDs.length > 0) {
            const filesStream = pgHelper.streamFiles(fileIDs);
            for await (const file of filesStream) {
              const base64EncodingMark = ';base64,';
              const base64EncodingMarkIndex =
                file.file.indexOf(base64EncodingMark);
              if (base64EncodingMarkIndex !== -1) {
                const fileData = Buffer.from(
                  file.file.substring(
                    base64EncodingMarkIndex + base64EncodingMark.length
                  ),
                  'base64'
                );
                archive.append(fileData, {
                  name: 'files/' + file.id + '-' + file.file_name,
                });
              }
            }
          }
          archive.finalize();
        });
      }
    }

    if (exportLabResults) {
      const labResultsStream = pgHelper.streamLabResults(
        foundProbands,
        start_date,
        end_date
      );
      const transformStream = createTransformStream(transformLabResult);
      const csvStream = stringify({ header: true });
      archive.append(labResultsStream.pipe(transformStream).pipe(csvStream), {
        name: 'lab_results.csv',
      });
    }

    if (exportSamples) {
      const samplesStream = pgHelper.streamSamples(foundProbands);
      const transformStream = createTransformStream(transformSample);
      const csvStream = stringify({ header: true });
      archive.append(samplesStream.pipe(transformStream).pipe(csvStream), {
        name: 'samples.csv',
      });
    }

    if (exportBloodSamples) {
      const bloodSamplesStream = pgHelper.streamBloodSamples(foundProbands);
      const transformStream = createTransformStream(transformBloodSample);
      const csvStream = stringify({ header: true });
      archive.append(bloodSamplesStream.pipe(transformStream).pipe(csvStream), {
        name: 'blood_samples.csv',
      });
    }

    if (exportSettings) {
      const settingsStream = pgHelper.streamSettings(foundProbands);
      const transformStream = createTransformStream(transformSettings);
      const csvStream = stringify({ header: true });
      archive.append(settingsStream.pipe(transformStream).pipe(csvStream), {
        name: 'settings.csv',
      });
    }
    if (!(exportAnswers && exportFiles)) {
      archive.finalize();
    }
    return archive;
  }

  /**
   * Creates a data search and returns the search result as a stream
   * @param {string} decodedToken the jwt of the request
   * @param {object} searchCriteria the criteria for searching
   * @param {object} pgHelper helper object to query postgres db
   * @returns {Promise<import('stream').Readable>} promise a promise that will be resolved in case of success or rejected otherwise
   * @throws {Boom}
   */
  async function createSearch(decodedToken, searchCriteria, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Forscher':
        try {
          await pgHelper.getStudyAccessForUser(
            searchCriteria.study_name,
            userName
          );
        } catch (err) {
          console.log(err);
          throw Boom.forbidden(
            'Could not create the search, because user has no access to study'
          );
        }
        return await search(searchCriteria, pgHelper);
      default:
        throw Boom.forbidden(
          'Could not create the search: Unknown or wrong role'
        );
    }
  }

  return {
    createSearch: createSearch,
  };
})();

module.exports = searchesInteractor;
