const { Message, Segment } = require('nodengine-hl7');
const dateFns = require('date-fns');
const { Transform } = require('stream');

const TAG = 'LAB RESULT IMPORT - HL7 PARSER:';

class ParseHl7FilesToLabResultsStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  /**
   * Parses all files and converts them to a new LabResult
   * @param {ImportFile} file
   * @param enc
   * @param callback
   * @private
   */
  _transform(file, enc, callback) {
    let count = 0;
    let currentMessage = null;
    try {
      file.content.split(/\r?\n|\r/).forEach((line) => {
        const delims = currentMessage ? currentMessage.delimiters() : null;
        const segment = new Segment(line, delims);
        if (segment && segment.parsed) {
          if (segment.isHeader()) {
            if (currentMessage) {
              this._pushMessage(currentMessage, file);
              count++;
            }
            currentMessage = new Message();
            currentMessage.addSegment(segment);
          } else if (currentMessage) {
            currentMessage.addSegment(segment);
          }
        }
      });
      if (currentMessage) {
        this._pushMessage(currentMessage, file);
        count++;
      }
      console.log(TAG, 'Parsed', count, 'result(s) of file:', file.path);
    } catch (e) {
      console.log(TAG, 'Could not parse file:', file.path, e);
    }
    callback();
  }

  _pushMessage(currentMessage, file) {
    const result =
      ParseHl7FilesToLabResultsStream._convertHl7ToDatabaseObject(
        currentMessage
      );
    this.push({ ...file, result });
  }

  /**
   * @param {import('nodengine-hl7').Message} message hl7Message you want to convert to DB Objects
   * @return {LabResult}
   */
  static _convertHl7ToDatabaseObject(message) {
    const labResult = {
      id: null,
      order_id: null,
      performing_doctor: null,
      lab_observations: [],
    };
    message.segments
      .filter(({ parsed: segment }) => segment.SegmentType === 'PID')
      .forEach(({ parsed: segment }) => {
        const patientName = segment.PatientName.split('^');
        let id = patientName[1];
        if (id.substring(0, 2) === ', ') {
          id = id.substring(2, id.length);
        }
        labResult.id = id.toUpperCase();
      });
    message.segments
      .filter(({ parsed: segment }) => segment.SegmentType === 'ORC')
      .forEach(({ parsed: segment }) => {
        labResult.order_id = segment.PlacerOrderNumber.split('^')[0];
      });
    message.segments
      .filter(({ parsed: segment }) => segment.SegmentType === 'OBX')
      .forEach(({ parsed: segment }) => {
        const observationId = segment.ObservationIdentifier.split('^');
        const observationValues = segment.ObservationValue.split('/');
        const result_bool =
          observationValues.length > 1
            ? ParseHl7FilesToLabResultsStream._stringToBool(
                observationValues[1]
              )
            : ParseHl7FilesToLabResultsStream._stringToBool(
                observationValues[0]
              );
        const lab_observation = {
          name_id: observationId[0],
          name: observationId[1],
          result_string: result_bool ? 'positiv' : 'negativ',
          result_value:
            observationValues.length > 1 ? observationValues[0] : null,
          date_of_announcement: new Date(),
          lab_name: 'MHH',
        };
        labResult.lab_observations.push(lab_observation);
      });

    message.segments
      .filter(({ parsed: segment }) => segment.SegmentType === 'OBR')
      .forEach(({ parsed: segment }) => {
        if (!labResult.performing_doctor) {
          labResult.performing_doctor = segment.PrincipalResultInterpreter;
        }

        if (labResult.lab_observations.length === 0) {
          return;
        }
        const universalServiceID =
          ParseHl7FilesToLabResultsStream._parseUniversalServiceID(
            segment.UniversalServiceID
          );
        const material = universalServiceID?.alternateText;
        if (material && !labResult.lab_observations[0].material) {
          labResult.lab_observations.forEach((observation) => {
            observation.material = material;
          });
        }

        const date_of_analysis =
          ParseHl7FilesToLabResultsStream._parseDateFromSegment(
            segment.ResultsRptStatusChngDateTime.toString()
          );
        if (
          date_of_analysis &&
          !labResult.lab_observations[0].date_of_analysis
        ) {
          labResult.lab_observations.forEach((observation) => {
            observation.date_of_analysis = date_of_analysis;
          });
        }

        const date_of_delivery =
          ParseHl7FilesToLabResultsStream._parseDateFromSegment(
            segment.SpecimenReceivedDateTime.toString()
          );
        if (
          date_of_delivery &&
          !labResult.lab_observations[0].date_of_delivery
        ) {
          labResult.lab_observations.forEach((observation) => {
            observation.date_of_delivery = date_of_delivery;
          });
        }
      });

    message.segments
      .filter(({ parsed: segment }) => segment.SegmentType === 'NTE')
      .forEach(({ parsed: segment }) => {
        if (segment.Comment) {
          labResult.lab_observations.forEach((observation) => {
            observation.comment = segment.Comment;
          });
        }
      });

    return labResult;
  }

  static _stringToBool(str) {
    return str !== 'neg';
  }

  static _parseDateFromSegment(dateString) {
    const date = dateFns.parse(
      dateString,
      'yyyyMdHm',
      dateFns.startOfDay(new Date())
    );
    if (dateFns.isValid(date)) {
      return date;
    }
    return dateFns.parse(
      dateString.substring(0, 8),
      'yyyyMd',
      dateFns.startOfDay(new Date())
    );
  }

  /**
   * Parses the UniversalServiceID based on the following format:
   * <Identifier (ST)>^<Text (ST)>^<Name of Coding System (ID)>^<Alternate Identifier (ST)>^<Alternate Text (ST)>
   *
   * Source: http://www.hl7.eu/refactored/segOBR.html
   *
   * @example
   * _parseUniversalServiceID("g20469155^^^na^Nasenabstrich")
   *
   * returns:
   * {
   *   identifier: 'g20469155',
   *   text: '',
   *   nameOfCodingSystem: '',
   *   alternateIdentifier: 'na',
   *   alternateText: 'Nasenabstrich'
   * }
   *
   * @param value
   */
  static _parseUniversalServiceID(value) {
    const regex = new RegExp(
      /(?<identifier>[^^]*)\^(?<text>[^^]*)\^(?<nameOfCodingSystem>[^^]*)\^(?<alternateIdentifier>[^^]*)\^(?<alternateText>[^^]*)/
    );
    return { ...regex.exec(value).groups };
  }
}

module.exports = ParseHl7FilesToLabResultsStream;
