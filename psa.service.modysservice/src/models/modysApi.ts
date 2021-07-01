export interface VPersonOverview {
  addressAddon?: string;
  addressId?: number;
  addressValidFrom?: Timestamp;
  addressValidUntil?: Timestamp;
  cityName?: string;
  dayOfBirth?: number;
  firstname?: string;
  firstnameAddon?: string;
  monthOfBirth?: number;
  name?: string;
  nationalityLanguageKey?: string;
  personId?: string;
  placeOfBirth?: string;
  postcode?: string;
  salutation?: string;
  sexLanguageKey?: string;
  stateFkLang?: string;
  streetName?: string;
  streetNumber?: string;
  title?: string;
  yearOfBirth?: number;
}

export interface VPersonContactDetailOverview {
  contactDetailTypeId?: ContactDetailTypeId;
  contactDetailTypeOrdinal?: number;
  createUser?: number;
  descriptionLanguageKey?: string;
  id?: number;
  lastchange?: Timestamp;
  nameLanguageKey?: string;
  personId?: string;
  remark?: string;
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  value?: string;
}

export enum ContactDetailTypeId {
  TELEFON_PRIVAT = 1,
  TELEFON_DIENST = 2,
  TELEFON_MOBIL = 3,
  EMAIL = 5,
}

export interface Timestamp {
  date?: number;
  day?: number;
  hours?: number;
  minutes?: number;
  month?: number;
  nanos?: number;
  seconds?: number;
  time?: number;
  timezoneOffset?: number;
  year?: number;
}
