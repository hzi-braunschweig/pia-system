/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PersonalDataDb {
  pseudonym: string;
  study: string;
  anrede: string | null;
  titel: string | null;
  name: string | null;
  vorname: string | null;
  strasse: string | null;
  haus_nr: string | null;
  plz: string | null;
  landkreis: string | null;
  ort: string | null;
  telefon_privat: string | null;
  telefon_dienst: string | null;
  telefon_mobil: string | null;
  email: string | null;
  comment: string | null;
}

export type PersonalDataReq = Partial<PersonalDataDb>;

/**
 * Personal data of a participant
 */
export interface PersonalData {
  /**
   * @example "Ms."
   */
  salutation?: string;
  /**
   * @example "Dr."
   */
  title?: string;
  /**
   * @example "Jane"
   */
  firstname: string;
  /**
   * @example "Doe"
   */
  lastname: string;
  address?: Address;
  phone?: PhoneNumbers;
  /**
   * @example "jane.doe@localhost.local"
   * @pattern ^.+\@.+\..+$
   */
  email?: string;
  /**
   * An internal comment
   * @example "This participant has a comment"
   */
  comment?: string;
}

/**
 * Address of a participant
 */
export interface Address {
  /**
   * @example "Main Street"
   */
  street: string;
  /**
   * @example "42"
   */
  houseNumber: string;
  /**
   * @example "Metropolis"
   */
  city: string;
  /**
   * @example "12345"
   */
  postalCode: string;
  /**
   * @example "State"
   */
  state?: string;
}

/**
 * Set of phone numbers for a participant
 */
export interface PhoneNumbers {
  /**
   * @example "+12 345 678 90"
   */
  private?: string;
  /**
   * @example "+12 345 678 90"
   */
  work?: string;
  /**
   * @example "+12 123 456 789 10"
   */
  mobile?: string;
}
