/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PersonalDataInternalDto {
  anrede?: string;
  titel?: string;
  name?: string;
  vorname?: string;
  strasse?: string;
  haus_nr?: string;
  plz?: string;
  landkreis?: string;
  ort?: string;
  telefon_privat?: string;
  telefon_dienst?: string;
  telefon_mobil?: string;
  email?: string;
  comment?: string;
}

export type PersonalDataInternalDtoGet = Required<PersonalDataInternalDto> & {
  pseudonym: string;
  study: string;
};
