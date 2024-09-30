/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pseudonym, StudyName, Expand } from '@pia/lib-publicapi';
import {
  PersonalData,
  PersonalDataDb,
  Address,
} from '../../models/personalDataDb';

export interface PartialAddress extends Expand<Partial<Address>> {}

export interface PersonalDataPatchRequestDto
  extends Expand<Partial<Omit<PersonalData, 'address'>>> {
  address?: PartialAddress;
}

export interface PersonalDataPatchResponseDto
  extends Expand<PersonalDataPatchRequestDto> {}

export function mapPersonalDataDtoToPersonalDataModel(
  study: StudyName,
  pseudonym: Pseudonym,
  personalDataDto: PersonalDataPatchRequestDto
): PersonalDataDb {
  return {
    study: study,
    pseudonym: pseudonym,
    anrede: personalDataDto.salutation ?? null,
    titel: personalDataDto.title ?? null,
    name: personalDataDto.lastname ?? null,
    vorname: personalDataDto.firstname ?? null,
    strasse: personalDataDto.address?.street ?? null,
    haus_nr: personalDataDto.address?.houseNumber ?? null,
    plz: personalDataDto.address?.postalCode ?? null,
    landkreis: personalDataDto.address?.state ?? null,
    ort: personalDataDto.address?.city ?? null,
    telefon_privat: personalDataDto.phone?.private ?? null,
    telefon_dienst: personalDataDto.phone?.work ?? null,
    telefon_mobil: personalDataDto.phone?.mobile ?? null,
    email: personalDataDto.email ?? null,
    comment: personalDataDto.comment ?? null,
  };
}

export function mapPersonalDataModelToPersonalDataDto(
  personalData: PersonalDataDb
): PersonalDataPatchResponseDto {
  const hasAddress =
    personalData.strasse !== null ||
    personalData.plz !== null ||
    personalData.landkreis !== null ||
    personalData.ort !== null ||
    personalData.haus_nr !== null;

  const hasPhone =
    personalData.telefon_privat !== null ||
    personalData.telefon_dienst !== null ||
    personalData.telefon_mobil !== null;

  return {
    salutation: personalData.anrede ?? undefined,
    title: personalData.titel ?? undefined,
    lastname: personalData.name ?? undefined,
    firstname: personalData.vorname ?? undefined,
    address: hasAddress
      ? {
          street: personalData.strasse ?? undefined,
          houseNumber: personalData.haus_nr ?? undefined,
          postalCode: personalData.plz ?? undefined,
          state: personalData.landkreis ?? undefined,
          city: personalData.ort ?? undefined,
        }
      : undefined,
    phone: hasPhone
      ? {
          private: personalData.telefon_privat ?? undefined,
          work: personalData.telefon_dienst ?? undefined,
          mobile: personalData.telefon_mobil ?? undefined,
        }
      : undefined,
    email: personalData.email ?? undefined,
    comment: personalData.comment ?? undefined,
  };
}
