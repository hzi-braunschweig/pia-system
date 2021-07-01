import parse from 'csv-parse/lib/sync';
import * as dateFns from 'date-fns';
import { Transform, TransformCallback } from 'stream';
import { ImportFile } from '../../models/ImportFile';
import { LabResult } from '../../models/LabResult';
import { LabObservation } from '../../models/LabObservation';

type CsvLine = Record<string, string>;

export class ParseCsvFilesToLabResultsStream extends Transform {
  private static readonly TAG = 'LAB RESULT IMPORT - CSV PARSER:';

  private readonly possibleDelimiters = [';', ',', ':', '|'];
  private readonly parseOptions = {
    delimiter: ';',
    trim: true,
    columns: true,
    skip_empty_lines: true,
    skip_lines_with_error: true,
  };

  public constructor() {
    super({ objectMode: true });
  }

  /**
   * Valid lab results need to have a Proben-ID
   */
  private static filterEmpty(results: CsvLine[]): CsvLine[] {
    return results.filter((result) => result['Proben-ID']);
  }

  /**
   * Groups results containing the same Proben-ID into sub arrays
   * such that they can be put into an own lab result at the next step
   */
  private static getGroupedResults(results: CsvLine[]): CsvLine[][] {
    const groups: Map<string, Record<string, string>[]> = results.reduce(
      (resultMap, parsedObject) => {
        return ParseCsvFilesToLabResultsStream.groupByProbenId(
          resultMap,
          parsedObject
        );
      },
      new Map<string, Record<string, string>[]>()
    );
    return Array.from(groups.values());
  }

  private static groupByProbenId(
    resultMap: Map<string, Record<string, string>[]>,
    parsedObject: Record<string, string>
  ): Map<string, Record<string, string>[]> {
    if (!parsedObject['Proben-ID']) {
      return resultMap;
    }
    if (!resultMap.has(parsedObject['Proben-ID'])) {
      resultMap.set(parsedObject['Proben-ID'], []);
    }
    resultMap.get(parsedObject['Proben-ID'])?.push(parsedObject);
    return resultMap;
  }

  /**
   * The actual mapping between the CSV columns and the internal
   * lab result representation
   */
  private static mapParsedGroupToLaboratoryResult(
    groupArray: CsvLine[]
  ): LabResult | undefined {
    if (groupArray.length === 0) {
      console.log(
        ParseCsvFilesToLabResultsStream.TAG,
        'Filtering empty lab result group'
      );
      return undefined;
    }
    const labResultId = groupArray[0]?.['Proben-ID']?.toUpperCase();
    if (!labResultId) {
      console.log(
        ParseCsvFilesToLabResultsStream.TAG,
        'Filtering lab results with no ID'
      );
      return undefined;
    }

    const observations = groupArray
      .map((result) => {
        const convertedResult: LabObservation = {
          lab_result_id: labResultId,
          name_id: 0,
          name: result['Untersuchung'],
          result_value: result['Ergebnis (quantitativ)'],
          comment: result['Bemerkung'],
          date_of_analysis: ParseCsvFilesToLabResultsStream.parseDate(
            result['Analysedatum']
          ),
          date_of_delivery: ParseCsvFilesToLabResultsStream.parseDate(
            result['Eingang der Probe']
          ),
          date_of_announcement: ParseCsvFilesToLabResultsStream.parseDate(
            result['Datum der Ergebnismitteilung']
          ),
          lab_name: result['Labor'],
          material: result['Material'],
          result_string: result['Ergebnis (qualitativ)'],
          unit: result['Unit'],
          other_unit: result['Andere Unit'],
          kit_name: result['Kit/Firma'],
        };
        return convertedResult;
      })
      .filter((observation) => !!observation.lab_result_id);

    // An entry without observations is no lab result
    if (!observations.length) {
      console.log(
        ParseCsvFilesToLabResultsStream.TAG,
        'Filtering lab result without observations'
      );
      return undefined;
    }

    return {
      id: labResultId,
      order_id: null,
      status: null,
      performing_doctor: null,
      lab_observations: observations,
    };
  }

  /**
   * Parses a string in different formats and converts it into a Date-object:
   * First try is the default of node `new Date(value)`
   * Second try is by checking if the string is in format 'dd.MM.yy'.
   * Third try is by checking if the string is in format 'dd.MM.yyyy'.
   * If none of them worked, it returns an invalid Date object.
   */
  private static parseDate(dateString?: string): Date | null {
    if (!dateString) {
      return null;
    }
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    date = dateFns.parse(
      dateString,
      'dd.MM.yy',
      dateFns.startOfDay(new Date())
    );
    if (!isNaN(date.getTime())) {
      return date;
    }
    return dateFns.parse(
      dateString,
      'dd.MM.yyyy',
      dateFns.startOfDay(new Date())
    );
  }

  public _transform(
    file: ImportFile,
    _enc: BufferEncoding,
    callback: TransformCallback
  ): void {
    let parsedContent;
    try {
      parsedContent = this.parseCsv(file.content);
    } catch (e) {
      console.log(
        ParseCsvFilesToLabResultsStream.TAG,
        'Could not parse content of file:',
        file.path,
        e
      );
      return callback();
    }
    let count = 0;
    ParseCsvFilesToLabResultsStream.getGroupedResults(parsedContent)
      .map((group, index) => {
        try {
          const result =
            ParseCsvFilesToLabResultsStream.mapParsedGroupToLaboratoryResult(
              group
            );
          count++;
          return result;
        } catch (e) {
          console.log(
            ParseCsvFilesToLabResultsStream.TAG,
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
    console.log(
      ParseCsvFilesToLabResultsStream.TAG,
      'Parsed',
      count,
      'result(s) of file:',
      file.path
    );
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
  private parseCsv(csvString: string): Record<string, string>[] {
    let maxOccurrences = 0;
    let delimiter = ',';
    this.possibleDelimiters.forEach((currentDelimiter) => {
      const currentOccurrences = csvString.split(currentDelimiter).length;
      if (currentOccurrences > maxOccurrences) {
        maxOccurrences = currentOccurrences;
        delimiter = currentDelimiter;
      }
    });
    const parsed = parse(csvString, {
      ...this.parseOptions,
      delimiter,
    }) as CsvLine[];
    return ParseCsvFilesToLabResultsStream.filterEmpty(parsed);
  }
}
