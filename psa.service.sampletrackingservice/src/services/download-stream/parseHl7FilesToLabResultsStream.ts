/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/// <reference types="../../@types/nodengine-hl7" />
import * as dateFns from 'date-fns';
import { Transform, TransformCallback } from 'stream';
import { Message, Segment } from 'nodengine-hl7';
import { ImportFile } from '../../models/ImportFile';
import { LabResult } from '../../models/LabResult';
import { LabObservation } from '../../models/LabObservation';

export class ParseHl7FilesToLabResultsStream extends Transform {
  private static readonly TAG = 'LAB RESULT IMPORT - HL7 PARSER:';

  private static readonly SECOND_CHAR = 2;
  private static readonly EIGHTH_CHAR = 8;

  public constructor() {
    super({ objectMode: true });
  }

  /**
   * @param message hl7Message you want to convert to DB Objects
   */
  private static convertHl7ToDatabaseObject(message: Message): LabResult {
    const labResult: LabResult = {
      id: '',
      order_id: null,
      performing_doctor: null,
      lab_observations: [],
    };

    message.segments.forEach(({ parsed: segment }) => {
      if (segment?.SegmentType !== 'PID') return;
      const patientName = segment.PatientName.split('^');
      let id = patientName[1];
      if (id) {
        if (id.startsWith(', ')) {
          id = id.substring(this.SECOND_CHAR, id.length);
        }
        labResult.id = id.toUpperCase();
      }
    });

    message.segments.forEach(({ parsed: segment }) => {
      if (segment?.SegmentType !== 'ORC') return;
      labResult.order_id = Number(segment.PlacerOrderNumber.split('^')[0]);
    });

    message.segments.forEach(({ parsed: segment }) => {
      if (segment?.SegmentType !== 'OBX') return;
      const observationId = segment.ObservationIdentifier.split('^');
      const observationValues = segment.ObservationValue.split('/');
      const lab_observation: LabObservation = {
        name_id: Number(observationId[0]),
        name: observationId[1],
        result_string:
          observationValues.length > 1
            ? ParseHl7FilesToLabResultsStream.stringToBool(
                observationValues[1]!
              )
            : ParseHl7FilesToLabResultsStream.stringToBool(
                observationValues[0]!
              ),
        result_value:
          observationValues.length > 1 ? observationValues[0] : null,
        date_of_announcement: new Date(),
        lab_name: 'MHH',
      };
      labResult.lab_observations!.push(lab_observation);
    });

    message.segments.forEach(({ parsed: segment }) => {
      if (segment?.SegmentType !== 'OBR') return;
      if (!labResult.performing_doctor) {
        labResult.performing_doctor = segment.PrincipalResultInterpreter;
      }

      if (!labResult.lab_observations?.length) {
        return;
      }
      const firstLabObservationEntry = labResult.lab_observations[0]!;
      const universalServiceID =
        ParseHl7FilesToLabResultsStream.parseUniversalServiceID(
          segment.UniversalServiceID
        );
      const material = universalServiceID?.alternateText;
      if (material && !firstLabObservationEntry.material) {
        labResult.lab_observations.forEach((observation) => {
          observation.material = material;
        });
      }

      const date_of_analysis =
        ParseHl7FilesToLabResultsStream.parseDateFromSegment(
          segment.ResultsRptStatusChngDateTime.toString()
        );
      if (!firstLabObservationEntry.date_of_analysis) {
        labResult.lab_observations.forEach((observation) => {
          observation.date_of_analysis = date_of_analysis;
        });
      }

      const date_of_delivery =
        ParseHl7FilesToLabResultsStream.parseDateFromSegment(
          segment.SpecimenReceivedDateTime.toString()
        );
      if (date_of_delivery && !firstLabObservationEntry.date_of_delivery) {
        labResult.lab_observations.forEach((observation) => {
          observation.date_of_delivery = date_of_delivery;
        });
      }
    });

    message.segments.forEach(({ parsed: segment }) => {
      if (segment?.SegmentType !== 'NTE') return;
      if (segment.Comment) {
        labResult.lab_observations!.forEach((observation) => {
          observation.comment = segment.Comment;
        });
      }
    });

    return labResult;
  }

  private static stringToBool(str: string): string {
    if (str === 'neg') {
      return 'negativ';
    } else if (str === 'pos') {
      return 'positiv';
    } else {
      return 'NA';
    }
  }

  private static parseDateFromSegment(dateString?: string): Date | null {
    if (!dateString) return null;
    let date = dateFns.parse(
      dateString,
      'yyyyMdHm',
      dateFns.startOfDay(new Date())
    );
    if (dateFns.isValid(date)) {
      return date;
    }
    date = dateFns.parse(
      dateString.substring(0, this.EIGHTH_CHAR),
      'yyyyMd',
      dateFns.startOfDay(new Date())
    );
    if (dateFns.isValid(date)) {
      return date;
    }
    return null;
  }

  /**
   * Parses the UniversalServiceID based on the following format:
   * <Identifier (ST)>^<Text (ST)>^<Name of Coding System (ID)>^<Alternate Identifier (ST)>^<Alternate Text (ST)>
   *
   * Source: http://www.hl7.eu/refactored/segOBR.html
   *
   * @example
   * parseUniversalServiceID("g20469155^^^na^Nasenabstrich")
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
   */
  private static parseUniversalServiceID(
    value: string | undefined
  ): { alternateText?: string } | null {
    if (!value) return null;
    const regex =
      /(?<identifier>[^^]*)\^(?<text>[^^]*)\^(?<nameOfCodingSystem>[^^]*)\^(?<alternateIdentifier>[^^]*)\^(?<alternateText>[^^]*)/;
    const groups = regex.exec(value)?.groups;
    if (!groups) return null;
    return { ...groups };
  }

  /**
   * Parses all files and converts them to a new LabResult
   */
  public _transform(
    file: ImportFile,
    _enc: BufferEncoding,
    callback: TransformCallback
  ): void {
    let count = 0;
    let currentMessage: Message | null = null;
    try {
      const lines = file.content.split(/\r?\n|\r/);
      for (const line of lines) {
        const delims = currentMessage ? currentMessage.delimiters() : undefined;
        const segment = new Segment(line, delims);
        if (segment.parsed) {
          if (segment.isHeader()) {
            if (currentMessage) {
              this.pushMessage(currentMessage, file);
              count++;
            }
            currentMessage = new Message();
            currentMessage.addSegment(segment);
          } else if (currentMessage) {
            currentMessage.addSegment(segment);
          }
        }
      }
      if (currentMessage) {
        this.pushMessage(currentMessage, file);
        count++;
      }
      console.log(
        ParseHl7FilesToLabResultsStream.TAG,
        'Parsed',
        count,
        'result(s) of file:',
        file.path
      );
    } catch (e) {
      console.log(
        ParseHl7FilesToLabResultsStream.TAG,
        'Could not parse file:',
        file.path,
        e
      );
    }
    callback();
  }

  private pushMessage(currentMessage: Message, file: ImportFile): void {
    const result =
      ParseHl7FilesToLabResultsStream.convertHl7ToDatabaseObject(
        currentMessage
      );
    this.push({ ...file, result });
  }
}
