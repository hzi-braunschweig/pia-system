/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabResultObservation } from '../../models/labResultObservation';
import { CsvLabResultObservationRow } from '../../models/csvExportRows';
import { CsvTransform } from './csvTransform';

export class LabResultTransform extends CsvTransform<
  LabResultObservation,
  CsvLabResultObservationRow
> {
  /**
   * Transforms a observation into a csv lab result line object.
   */
  protected convertToCsvRow(
    observation: LabResultObservation
  ): CsvLabResultObservationRow {
    return {
      Bericht_ID: observation.lab_result_id,
      Proband: observation.user_id,
      Datum_Abnahme: this.formatDate(observation.date_of_sampling),
      Datum_Eingang: this.formatDate(observation.date_of_delivery),
      Datum_Analyse: this.formatDate(observation.date_of_analysis),
      Datum_Mitteilung: this.formatDate(observation.date_of_announcement),
      PCR: observation.name,
      PCR_ID: observation.name_id,
      Ergebnis: observation.result_string,
      'CT-Wert': observation.result_value ? observation.result_value : '.',
      Auftragsnr: observation.order_id,
      Arzt: observation.performing_doctor ? observation.performing_doctor : '.',
      Kommentar: observation.comment,
    };
  }
}
