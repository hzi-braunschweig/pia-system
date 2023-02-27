/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FullAnswer } from '../../models/answer';
import { AnswerType } from '../../models/answerOption';
import { CsvLegacyAnswerRow } from '../../models/csvExportRows';
import { CsvTransform } from './csvTransform';

export class LegacyAnswersTransform extends CsvTransform<
  FullAnswer,
  CsvLegacyAnswerRow
> {
  private static readonly SECOND_ANSWER_VERSION = 2;
  private readonly containedFileIDs: Set<string> = new Set<string>();

  /**
   * Parses a string in different formats and converts it into a Date-object:
   * First try is the default of node `new Date(value)`
   * Second try is by checking if the value is a number.
   * If that is the case, it will be handled as a numerous timestamp.
   */
  private static convertStringToDateObject(value: string): Date {
    let date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    date = new Date(parseInt(value, 10));
    if (!isNaN(date.getTime())) {
      return date;
    }
    throw new Error('Could not parse the date');
  }

  public getContainedFileIDs(): string[] {
    return Array.from(this.containedFileIDs);
  }

  /**
   * Transforms a answer into a csv answer line object.
   */
  protected convertToCsvRow(
    answer: FullAnswer
  ): CsvLegacyAnswerRow | undefined {
    if (
      answer.versioning === LegacyAnswersTransform.SECOND_ANSWER_VERSION &&
      answer.status === 'released_once'
    ) {
      // these answers were made by the proband after releasing the questionnaire instance for the first time,
      // but he has not yet released them a second time, so they are not relevant for the researchers
      return undefined;
    }

    if (answer.value) {
      switch (answer.a_type) {
        case AnswerType.File:
        case AnswerType.Image:
          this.containedFileIDs.add(answer.value);
          break;
        case AnswerType.Date:
          try {
            const date = LegacyAnswersTransform.convertStringToDateObject(
              answer.value
            );
            answer.value = this.dateFormat.format(date);
          } catch (e) {
            console.error('Could not parse the date', answer.value);
          }
          break;
        case AnswerType.Timestamp:
          try {
            const date = LegacyAnswersTransform.convertStringToDateObject(
              answer.value
            );
            answer.value = this.dateTimeFormat.format(date);
          } catch (e) {
            console.error('Could not parse the timestamp', answer.value);
          }
          break;
      }
    }

    let antwort_datum;
    switch (answer.status) {
      case 'released_once':
        antwort_datum = this.formatDate(answer.date_of_release_v1);
        break;
      case 'released_twice':
        antwort_datum = this.formatDate(answer.date_of_release_v2);
        break;
      case 'released':
        antwort_datum = this.formatDate(answer.date_of_release);
        break;
      default:
        antwort_datum = '.';
        break;
    }

    return {
      Frage:
        answer.questionnaire_name +
        '_v' +
        answer.questionnaire_version.toString() +
        '_' +
        (answer.question_variable_name
          ? answer.question_variable_name
          : 'f' + answer.qposition.toString()) +
        '_' +
        (answer.answer_option_variable_name
          ? answer.answer_option_variable_name
          : answer.aposition.toString()) +
        (answer.versioning ? '_a' + answer.versioning.toString() : ''),
      Proband:
        answer.ids?.toLowerCase() === answer.user_id ? '' : answer.user_id,
      IDS: answer.ids ?? '',
      FB_Datum: this.formatDate(answer.date_of_issue),
      Antwort_Datum: antwort_datum,
      Antwort: answer.value
        ? answer.status === 'deleted'
          ? 'gelöscht'
          : answer.status === 'expired'
          ? 'abgelaufen'
          : answer.value
        : '.',
      Kodierung_Code: answer.values_code?.map((x) => x.toString()) ?? '',
      Kodierung_Wert: answer.values ?? '',
    };
  }
}
