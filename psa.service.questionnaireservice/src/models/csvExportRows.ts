/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface CsvAnswerRow {
  Antwort: string;
  Proband: string;
  FB_Datum: string;
  Antwort_Datum: string;
  Kodierung_Wert: string | string[];
  Kodierung_Code: string | string[];
  Frage: string;
}

export interface CsvLabResultObservationRow {
  PCR_ID: string;
  Kommentar: string;
  Auftragsnr: string;
  Bericht_ID: string;
  Proband: string;
  Datum_Mitteilung: string;
  Datum_Abnahme: string;
  Arzt: string;
  Datum_Eingang: string;
  Datum_Analyse: string;
  'CT-Wert': string;
  Ergebnis: string;
  PCR: string;
}

export interface CsvSampleRow {
  Proben_ID: string;
  Bakt_Proben_ID: string;
  Proband: string;
  Status: string;
  Bemerkung: string;
}

export interface CsvBloodSampleRow {
  Blutproben_ID: string;
  Proband: string;
  Status: string;
  Bemerkung: string;
}

export interface CsvUserSettingsRow {
  Proband: string;
  'Benachrichtigung Uhrzeit': string;
  'Einwilligung Ergebnismitteilung': string;
  'Einwilligung Probenentnahme': string;
  'Einwilligung Blutprobenentnahme': string;
  Testproband: string;
}
