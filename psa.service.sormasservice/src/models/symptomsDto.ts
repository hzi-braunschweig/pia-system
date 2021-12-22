/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// DTO for transfers to sormas
// schema from https://github.com/hzi-braunschweig/SORMAS-Project/blob/development/openapi/external_visits_API.json

export enum Bool3 {
  NO = 'NO',
  YES = 'YES',
  UNKNOWN = 'UNKNOWN',
}
export enum TemperatureSource {
  NON_CONTACT = 'NON_CONTACT',
  ORAL = 'ORAL',
  AXILLARY = 'AXILLARY',
  RECTAL = 'RECTAL',
}
export enum CongenitalHeartDiseaseType {
  PDA = 'PDA',
  PPS = 'PPS',
  VSD = 'VSD',
  OTHER = 'OTHER',
}

export interface SymptomsDto {
  creationDate?: string;
  changeDate?: string;
  uuid?: string;
  pseudonymized?: boolean;

  abdominalPain?: Bool3;
  anorexiaAppetiteLoss?: Bool3;
  backache?: Bool3;
  bedridden?: Bool3;
  blackeningDeathOfTissue?: Bool3;
  bleedingVagina?: Bool3;
  bloodInStool?: Bool3;
  bloodPressureDiastolic?: number;
  bloodPressureSystolic?: number;
  bloodUrine?: Bool3;
  bloodyBlackStool?: Bool3;
  buboesGroinArmpitNeck?: Bool3;
  bulgingFontanelle?: Bool3;
  chestPain?: Bool3;
  chillsSweats?: Bool3;
  conjunctivitis?: Bool3;
  cough?: Bool3;
  coughWithSputum?: Bool3;
  coughWithHeamoptysis?: Bool3;
  coughingBlood?: Bool3;
  darkUrine?: Bool3;
  dehydration?: Bool3;
  diarrhea?: Bool3;
  difficultyBreathing?: Bool3;
  digestedBloodVomit?: Bool3;
  eyePainLightSensitive?: Bool3;
  eyesBleeding?: Bool3;
  fatigueWeakness?: Bool3;
  fever?: Bool3;
  fluidInLungCavity?: Bool3;
  glasgowComaScale?: number;
  gumsBleeding?: Bool3;
  headache?: Bool3;
  hearingloss?: Bool3;
  heartRate?: number;
  height?: number;
  hiccups?: Bool3;
  injectionSiteBleeding?: Bool3;
  jaundice?: Bool3;
  jaundiceWithin24HoursOfBirth?: Bool3;
  jointPain?: Bool3;
  kopliksSpots?: Bool3;
  lesions?: Bool3;
  lesionsAllOverBody?: boolean;
  lesionsArms?: boolean;
  lesionsDeepProfound?: Bool3;
  lesionsFace?: boolean;
  lesionsGenitals?: boolean;
  lesionsLegs?: boolean;
  lesionsOnsetDate?: Date;
  lesionsPalmsHands?: boolean;
  lesionsResembleImg1?: Bool3;
  lesionsResembleImg2?: Bool3;
  lesionsResembleImg3?: Bool3;
  lesionsResembleImg4?: Bool3;
  lesionsSameSize?: Bool3;
  lesionsSameState?: Bool3;
  lesionsSolesFeet?: boolean;
  lesionsThatItch?: Bool3;
  lesionsThorax?: boolean;
  lossSkinTurgor?: Bool3;
  lymphadenopathy?: Bool3;
  lymphadenopathyAxillary?: Bool3;
  lymphadenopathyCervical?: Bool3;
  lymphadenopathyInguinal?: Bool3;
  malaise?: Bool3;
  midUpperArmCircumference?: number;
  musclePain?: Bool3;
  nausea?: Bool3;
  neckStiffness?: Bool3;
  noseBleeding?: Bool3;
  oedemaFaceNeck?: Bool3;
  oedemaLowerExtremity?: Bool3;
  onsetDate?: Date;
  onsetSymptom?: string;
  oralUlcers?: Bool3;
  otherHemorrhagicSymptoms?: Bool3;
  otherHemorrhagicSymptomsText?: string;
  otherNonHemorrhagicSymptoms?: Bool3;
  otherNonHemorrhagicSymptomsText?: string;
  otitisMedia?: Bool3;
  painfulLymphadenitis?: Bool3;
  palpableLiver?: Bool3;
  palpableSpleen?: Bool3;
  patientIllLocation?: string;
  pharyngealErythema?: Bool3;
  pharyngealExudate?: Bool3;
  rapidBreathing?: Bool3;
  redBloodVomit?: Bool3;
  refusalFeedorDrink?: Bool3;
  respiratoryRate?: number;
  runnyNose?: Bool3;
  sidePain?: Bool3;
  skinBruising?: Bool3;
  skinRash?: Bool3;
  soreThroat?: Bool3;
  stomachBleeding?: Bool3;
  sunkenEyesFontanelle?: Bool3;
  swollenGlands?: Bool3;
  symptomatic?: boolean;
  symptomsComments?: string;
  temperature?: number;
  temperatureSource?: TemperatureSource;
  throbocytopenia?: Bool3;
  tremor?: Bool3;
  bilateralCataracts?: Bool3;
  unilateralCataracts?: Bool3;
  congenitalGlaucoma?: Bool3;
  pigmentaryRetinopathy?: Bool3;
  purpuricRash?: Bool3;
  microcephaly?: Bool3;
  developmentalDelay?: Bool3;
  splenomegaly?: Bool3;
  meningoencephalitis?: Bool3;
  radiolucentBoneDisease?: Bool3;
  congenitalHeartDisease?: Bool3;
  congenitalHeartDiseaseType?: CongenitalHeartDiseaseType;
  congenitalHeartDiseaseDetails?: string;
  unexplainedBleeding?: Bool3;
  vomiting?: Bool3;
  hydrophobia?: Bool3;
  opisthotonus?: Bool3;
  anxietyStates?: Bool3;
  delirium?: Bool3;
  uproariousness?: Bool3;
  paresthesiaAroundWound?: Bool3;
  excessSalivation?: Bool3;
  insomnia?: Bool3;
  paralysis?: Bool3;
  excitation?: Bool3;
  dysphagia?: Bool3;
  aerophobia?: Bool3;
  hyperactivity?: Bool3;
  paresis?: Bool3;
  agitation?: Bool3;
  ascendingFlaccidParalysis?: Bool3;
  erraticBehaviour?: Bool3;
  coma?: Bool3;
  convulsion?: Bool3;
  fluidInLungCavityAuscultation?: Bool3;
  fluidInLungCavityXray?: Bool3;
  abnormalLungXrayFindings?: Bool3;
  conjunctivalInjection?: Bool3;
  acuteRespiratoryDistressSyndrome?: Bool3;
  pneumoniaClinicalOrRadiologic?: Bool3;
  lossOfTaste?: Bool3;
  lossOfSmell?: Bool3;
  wheezing?: Bool3;
  skinUlcers?: Bool3;
  inabilityToWalk?: Bool3;
  inDrawingOfChestWall?: Bool3;
  respiratoryDiseaseVentilation?: Bool3;
  feelingIll?: Bool3;
  fastHeartRate?: Bool3;
  oxygenSaturationLower94?: Bool3;
  weight?: number;
  alteredConsciousness?: Bool3;
  confusedDisoriented?: Bool3;
  hemorrhagicSyndrome?: Bool3;
  hyperglycemia?: Bool3;
  hypoglycemia?: Bool3;
  meningealSigns?: Bool3;
  otherComplications?: Bool3;
  otherComplicationsText?: string;
  seizures?: Bool3;
  sepsis?: Bool3;
  shock?: Bool3;
  feverishFeeling?: Bool3;
  weakness?: Bool3;
  fatigue?: Bool3;
  coughWithoutSputum?: Bool3;
  breathlessness?: Bool3;
  chestPressure?: Bool3;
  blueLips?: Bool3;
  bloodCirculationProblems?: Bool3;
  palpitations?: Bool3;
  dizzinessStandingUp?: Bool3;
  highOrLowBloodPressure?: Bool3;
  urinaryRetention?: Bool3;
  shivering?: Bool3;
}

//=== Further definition of types given by the api ================================

type FilterPropertiesOfType<T, Type> = {
  [Key in keyof T]: Type extends T[Key] ? Key : never;
};
type KeysOfType<T, Type> = FilterPropertiesOfType<T, Type>[keyof T];

export type SymptomStringKey = KeysOfType<Required<SymptomsDto>, string>;
export type SymptomIntegerKey = KeysOfType<Required<SymptomsDto>, number>;
export type SymptomFloatKey = KeysOfType<Required<SymptomsDto>, number>;
export type SymptomBooleanKey = KeysOfType<Required<SymptomsDto>, boolean>;
export type SymptomDateKey = KeysOfType<Required<SymptomsDto>, Date>;
export type SymptomBool3Key = KeysOfType<Required<SymptomsDto>, Bool3>;
export type SymptomTemperatureSourceKey = KeysOfType<
  Required<SymptomsDto>,
  TemperatureSource
>;
export type SymptomCongenitalHeartDiseaseTypeKey = KeysOfType<
  Required<SymptomsDto>,
  CongenitalHeartDiseaseType
>;

const symptomStringKeys: SymptomStringKey[] = [
  'onsetSymptom',
  'otherHemorrhagicSymptomsText',
  'otherNonHemorrhagicSymptomsText',
  'patientIllLocation',
  'symptomsComments',
  'congenitalHeartDiseaseDetails',
  'otherComplicationsText',
];
const symptomIntegerKeys: SymptomIntegerKey[] = [
  'bloodPressureDiastolic',
  'bloodPressureSystolic',
  'glasgowComaScale',
  'heartRate',
  'height',
  'midUpperArmCircumference',
  'respiratoryRate',
  'weight',
];
const symptomFloatKeys: SymptomFloatKey[] = ['temperature'];
const symptomBooleanKeys: SymptomBooleanKey[] = [
  'lesionsAllOverBody',
  'lesionsArms',
  'lesionsFace',
  'lesionsGenitals',
  'lesionsLegs',
  'lesionsPalmsHands',
  'lesionsSolesFeet',
  'lesionsThorax',
  'symptomatic',
];
const symptomDateKeys: SymptomDateKey[] = ['lesionsOnsetDate', 'onsetDate'];
const symptomBool3Keys: SymptomBool3Key[] = [
  'abdominalPain',
  'anorexiaAppetiteLoss',
  'backache',
  'bedridden',
  'blackeningDeathOfTissue',
  'bleedingVagina',
  'bloodInStool',
  'bloodUrine',
  'bloodyBlackStool',
  'buboesGroinArmpitNeck',
  'bulgingFontanelle',
  'chestPain',
  'chillsSweats',
  'conjunctivitis',
  'cough',
  'coughWithSputum',
  'coughWithHeamoptysis',
  'coughingBlood',
  'darkUrine',
  'dehydration',
  'diarrhea',
  'difficultyBreathing',
  'digestedBloodVomit',
  'eyePainLightSensitive',
  'eyesBleeding',
  'fatigueWeakness',
  'fever',
  'fluidInLungCavity',
  'gumsBleeding',
  'headache',
  'hearingloss',
  'hiccups',
  'injectionSiteBleeding',
  'jaundice',
  'jaundiceWithin24HoursOfBirth',
  'jointPain',
  'kopliksSpots',
  'lesions',
  'lesionsDeepProfound',
  'lesionsResembleImg1',
  'lesionsResembleImg2',
  'lesionsResembleImg3',
  'lesionsResembleImg4',
  'lesionsSameSize',
  'lesionsSameState',
  'lesionsThatItch',
  'lossSkinTurgor',
  'lymphadenopathy',
  'lymphadenopathyAxillary',
  'lymphadenopathyCervical',
  'lymphadenopathyInguinal',
  'malaise',
  'musclePain',
  'nausea',
  'neckStiffness',
  'noseBleeding',
  'oedemaFaceNeck',
  'oedemaLowerExtremity',
  'oralUlcers',
  'otherHemorrhagicSymptoms',
  'otherNonHemorrhagicSymptoms',
  'otitisMedia',
  'painfulLymphadenitis',
  'palpableLiver',
  'palpableSpleen',
  'pharyngealErythema',
  'pharyngealExudate',
  'rapidBreathing',
  'redBloodVomit',
  'refusalFeedorDrink',
  'runnyNose',
  'sidePain',
  'skinBruising',
  'skinRash',
  'soreThroat',
  'stomachBleeding',
  'sunkenEyesFontanelle',
  'swollenGlands',
  'throbocytopenia',
  'tremor',
  'bilateralCataracts',
  'unilateralCataracts',
  'congenitalGlaucoma',
  'pigmentaryRetinopathy',
  'purpuricRash',
  'microcephaly',
  'developmentalDelay',
  'splenomegaly',
  'meningoencephalitis',
  'radiolucentBoneDisease',
  'congenitalHeartDisease',
  'unexplainedBleeding',
  'vomiting',
  'hydrophobia',
  'opisthotonus',
  'anxietyStates',
  'delirium',
  'uproariousness',
  'paresthesiaAroundWound',
  'excessSalivation',
  'insomnia',
  'paralysis',
  'excitation',
  'dysphagia',
  'aerophobia',
  'hyperactivity',
  'paresis',
  'agitation',
  'ascendingFlaccidParalysis',
  'erraticBehaviour',
  'coma',
  'convulsion',
  'fluidInLungCavityAuscultation',
  'fluidInLungCavityXray',
  'abnormalLungXrayFindings',
  'conjunctivalInjection',
  'acuteRespiratoryDistressSyndrome',
  'pneumoniaClinicalOrRadiologic',
  'lossOfTaste',
  'lossOfSmell',
  'wheezing',
  'skinUlcers',
  'inabilityToWalk',
  'inDrawingOfChestWall',
  'respiratoryDiseaseVentilation',
  'feelingIll',
  'fastHeartRate',
  'oxygenSaturationLower94',
  'alteredConsciousness',
  'confusedDisoriented',
  'hemorrhagicSyndrome',
  'hyperglycemia',
  'hypoglycemia',
  'meningealSigns',
  'otherComplications',
  'seizures',
  'sepsis',
  'shock',
  'feverishFeeling',
  'weakness',
  'fatigue',
  'coughWithoutSputum',
  'breathlessness',
  'chestPressure',
  'blueLips',
  'bloodCirculationProblems',
  'palpitations',
  'dizzinessStandingUp',
  'highOrLowBloodPressure',
  'urinaryRetention',
  'shivering',
];
const symptomTemperatureSourceKeys: SymptomTemperatureSourceKey[] = [
  'temperatureSource',
];
const symptomCongenitalHeartDiseaseTypeKeys: SymptomCongenitalHeartDiseaseTypeKey[] =
  ['congenitalHeartDiseaseType'];

export function isSymptomStringKey(key: unknown): key is SymptomStringKey {
  return symptomStringKeys.includes(key as SymptomStringKey);
}
export function isSymptomIntegerKey(key: unknown): key is SymptomIntegerKey {
  return symptomIntegerKeys.includes(key as SymptomIntegerKey);
}
export function isSymptomFloatKey(key: unknown): key is SymptomFloatKey {
  return symptomFloatKeys.includes(key as SymptomFloatKey);
}
export function isSymptomBooleanKey(key: unknown): key is SymptomBooleanKey {
  return symptomBooleanKeys.includes(key as SymptomBooleanKey);
}
export function isSymptomDateKey(key: unknown): key is SymptomDateKey {
  return symptomDateKeys.includes(key as SymptomDateKey);
}
export function isSymptomBool3Key(key: unknown): key is SymptomBool3Key {
  return symptomBool3Keys.includes(key as SymptomBool3Key);
}
export function isSymptomTemperatureSourceKey(
  key: unknown
): key is SymptomTemperatureSourceKey {
  return symptomTemperatureSourceKeys.includes(
    key as SymptomTemperatureSourceKey
  );
}
export function isSymptomCongenitalHeartDiseaseTypeKey(
  key: unknown
): key is SymptomCongenitalHeartDiseaseTypeKey {
  return symptomCongenitalHeartDiseaseTypeKeys.includes(
    key as SymptomCongenitalHeartDiseaseTypeKey
  );
}
