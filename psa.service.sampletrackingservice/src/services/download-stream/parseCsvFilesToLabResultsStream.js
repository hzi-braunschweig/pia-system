const parse = require('csv-parse/lib/sync');
const dateFns = require('date-fns');
const { Transform } = require('stream');

const TAG = 'LAB RESULT IMPORT - CSV PARSER:';

const possibleDelimiters = [';', ',', ':', '|'];
const parseOptions = {
  delimiter: ';',
  trim: true,
  columns: true,
  skip_empty_lines: true,
  skip_lines_with_error: true,
};

class ParseCsvFilesToLabResultsStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(file, enc, callback) {
    let parsedContent;
    try {
      parsedContent = this._parseCsv(file.content);
    } catch (e) {
      console.log(TAG, 'Could not parse content of file:', file.path, e);
      callback();
      return;
    }
    let count = 0;
    ParseCsvFilesToLabResultsStream._getGroupedResults(parsedContent)
      .map((group, index) => {
        try {
          const result =
            ParseCsvFilesToLabResultsStream._mapParsedGroupToLaboratoryResult(
              group
            );
          count++;
          return result;
        } catch (e) {
          console.log(
            TAG,
            'Could not convert group No.',
            index + 1,
            'of file:',
            file.path,
            e
          );
          return undefined;
        }
      })
      .filter(Boolean)
      .forEach((result) => {
        this.push({ ...file, result });
      });
    console.log(TAG, 'Parsed', count, 'result(s) of file:', file.path);
    callback();
  }

  /**
   * Returns the parsed rows from the CSV string as a list of objects
   * whose keys are the values of the CSV's first row.
   *
   * Auto detects the delimiter by searching for the maximum number of
   * occurences of all supported delimiters within the csv string.
   * Also filters out empty results.
   */
  _parseCsv(csvString) {
    let maxOccurrences = 0;
    let delimiter = null;
    possibleDelimiters.forEach((currentDelimiter) => {
      const currentOccurrences = csvString.split(currentDelimiter).length;
      if (currentOccurrences > maxOccurrences) {
        maxOccurrences = currentOccurrences;
        delimiter = currentDelimiter;
      }
    });
    const parsed = parse(csvString, {
      ...parseOptions,
      delimiter,
    });
    return ParseCsvFilesToLabResultsStream._filterEmpty(parsed);
  }

  /**
   * Valid lab results need to have a Proben-ID
   */
  static _filterEmpty(results) {
    return results.filter((result) => result['Proben-ID']);
  }

  /**
   * Groups results containing the same Proben-ID into sub arrays
   * such that they can be put into an own lab result at the next step
   */
  static _getGroupedResults(results) {
    const groups = results.reduce(
      ParseCsvFilesToLabResultsStream._groupByProbenId,
      {}
    );
    return [...Object.values(groups)];
  }

  static _groupByProbenId(resultMap, parsedObject) {
    if (!resultMap[parsedObject['Proben-ID']]) {
      resultMap[parsedObject['Proben-ID']] = [];
    }
    resultMap[parsedObject['Proben-ID']].push(parsedObject);
    return resultMap;
  }

  /**
   * The actual mapping between the CSV columns and the internal
   * lab result representation
   */
  static _mapParsedGroupToLaboratoryResult(groupArray) {
    if (!groupArray || !groupArray.length) {
      console.log(TAG, 'Filtering empty lab result group');
      return undefined;
    }
    const observations = groupArray
      .map((result) => ({
        lab_result_id: ParseCsvFilesToLabResultsStream._uppercaseOrNull(
          result['Proben-ID']
        ),
        name_id: 0,
        name: result['Untersuchung'],
        result_value: result['Ergebnis (quantitativ)'],
        comment: result['Bemerkung'],
        date_of_analysis: ParseCsvFilesToLabResultsStream._parseDate(
          result['Analysedatum']
        ),
        date_of_delivery: ParseCsvFilesToLabResultsStream._parseDate(
          result['Eingang der Probe']
        ),
        date_of_announcement: ParseCsvFilesToLabResultsStream._parseDate(
          result['Datum der Ergebnismitteilung']
        ),
        lab_name: result['Labor'],
        material: result['Material'],
        result_string: result['Ergebnis (qualitativ)'],
        unit: result['Unit'],
        other_unit: result['Andere Unit'],
        kit_name: result['Kit/Firma'],
      }))
      .filter((observation) => !!observation.lab_result_id);

    // An entry without observations is no lab result
    if (!observations.length) {
      console.log(TAG, 'Filtering lab result without observations');
      return undefined;
    }

    const firstResult = groupArray[0];

    return {
      id: ParseCsvFilesToLabResultsStream._uppercaseOrNull(
        firstResult['Proben-ID']
      ),
      order_id: null,
      status: null,
      performing_doctor: null,
      lab_observations: observations,
    };
  }

  static _parseDate(dateString) {
    if (!dateString) {
      return null;
    }
    let date = Date.parse(dateString);
    if (date instanceof Date && !isNaN(date)) {
      return date;
    }
    date = dateFns.parse(
      dateString,
      'dd.MM.yy',
      dateFns.startOfDay(new Date())
    );
    if (date instanceof Date && !isNaN(date)) {
      return date;
    }
    return dateFns.parse(
      dateString,
      'dd.MM.yyyy',
      dateFns.startOfDay(new Date())
    );
  }

  static _uppercaseOrNull(value) {
    return value ? value.toUpperCase() : null;
  }
}

module.exports = ParseCsvFilesToLabResultsStream;
