/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const mapperService = (function () {
  const converters = {
    identity: (target, key, value) => (target[key] = value),

    float: function (target, key, value) {
      if (!value) {
        return;
      }
      const fValue = parseFloat(value.replace(',', '.'));
      if (isNaN(fValue)) {
        console.warn(
          'mapperService: expected "value" to contain a valid number but got',
          value
        );
        return;
      }
      target[key] = String(fValue);
    },

    int: function (target, key, value) {
      if (!value) {
        return;
      }
      const iValue = parseInt(value);
      if (isNaN(iValue)) {
        console.warn(
          'mapperService: expected "value" to contain a valid number but got',
          value
        );
        return;
      }
      target[key] = String(iValue);
    },

    bool3: function (target, key, value) {
      switch (value) {
        case 1:
          target[key] = 'YES';
          break;
        case 0:
          target[key] = 'NO';
          break;
        default:
          target[key] = 'UNKNOWN';
      }
    },

    dateComponents: function (target, key, value) {
      const date = new Date(value);
      if (!isDateValid(date)) {
        console.warn(
          'mapperService: expected "value" to contain a valid date string but got',
          value
        );
        return;
      }
      target[`${key}DD`] = date.getDate();
      target[`${key}MM`] = date.getMonth() + 1;
      target[`${key}YY`] = date.getFullYear();
    },

    dateTimestamp: function (target, key, value) {
      const date = new Date(value);
      if (!isDateValid(date)) {
        console.warn(
          'mapperService: expected "value" to contain a valid date string but got',
          value
        );
        return;
      }
      target[key] = date.getTime();
    },

    temperatureSource: function (target, key, value) {
      switch (value) {
        case 0:
          target[key] = 'NON_CONTACT';
          break;
        case 1:
          target[key] = 'NON_CONTACT';
          break;
        case 2:
          target[key] = 'ORAL';
          break;
        case 3:
          target[key] = 'AXILLARY';
          break;
        case 4:
          target[key] = 'RECTAL';
          break;
      }
    },
  };

  const mapping = {
    birthdate: converters.dateComponents,
    cardiovascularDiseaseIncludingHypertension: converters.bool3,
    diabetes: converters.bool3,
    malignancyChemotherapy: converters.bool3,
    chronicPulmonaryDisease: converters.bool3,
    chronicLiverDisease: converters.bool3,
    chronicKidneyDisease: converters.bool3,
    chronicNeurologicCondition: converters.bool3,
    temperature: converters.float,
    fever: converters.bool3,
    temperatureSource: converters.temperatureSource,
    chillsSweats: converters.bool3,
    cough: converters.bool3,
    runnyNose: converters.bool3,
    soreThroat: converters.bool3,
    difficultyBreathing: converters.bool3,
    headache: converters.bool3,
    lossOfSmell: converters.bool3,
    lossOfTaste: converters.bool3,
    diarrhea: converters.bool3,
    nausea: converters.bool3,
    generalSignsOfDisease: converters.bool3,
    feverishFeeling: converters.bool3,
    fatigue: converters.bool3,
    weakness: converters.bool3,
    musclePain: converters.bool3,
    confusedDisoriented: converters.bool3,
    coughWithoutSputum: converters.bool3,
    coughWithSputum: converters.bool3,
    coughWithHaemoptysis: converters.bool3, // right name, for future use
    coughWithHeamoptysis: converters.bool3, // intermediate, wrong name used by SORMAS
    rapidBreathing: converters.bool3,
    breathlessness: converters.bool3,
    chestPressure: converters.bool3,
    chestPain: converters.bool3,
    blueLips: converters.bool3,
    bloodCirculationProblems: converters.bool3,
    fastHeartRate: converters.bool3,
    palpitations: converters.bool3,
    dizzinessStandingUp: converters.bool3,
    vomiting: converters.bool3,
    abdominalPain: converters.bool3,
    urinaryRetention: converters.bool3,
    skinRash: converters.bool3,
    otherNonHemorrhagicSymptoms: converters.bool3,
    otherNonHemorrhagicSymptomsText: converters.identity,
    onsetDate: converters.dateTimestamp,
    bloodPressureSystolic: converters.int,
    bloodPressureDiastolic: converters.int,
    heartRate: converters.int,
    symptomsComments: converters.identity,
    seizures: converters.bool3,
    otherHemorrhagicSymptoms: converters.bool3,
    otherHemorrhagicSymptomsText: converters.identity,
    otherComplications: converters.bool3,
    otherComplicationsText: converters.identity,
    shivering: converters.bool3,
    highOrLowBloodPressure: converters.bool3,
    feelingIll: converters.bool3,
    malignanyChemotherapy: converters.bool3,
    immunodeficiencyIncludingHiv: converters.bool3,
    otherConditions: converters.identity,
  };

  function mapPiaToSormas(answers) {
    const sormasAnswers = {};
    Object.keys(answers).map((key) => {
      const keyMapping = mapping[key];
      if (keyMapping) {
        keyMapping(sormasAnswers, key, answers[key]);
      }
    });
    return sormasAnswers;
  }

  /**
   * Checks whether a date instance contains a valid date
   * @param date Date instance
   * @returns {*|boolean}
   */
  function isDateValid(date) {
    return !isNaN(date);
  }

  return {
    mapPiaToSormas: mapPiaToSormas,
  };
})();

module.exports = mapperService;
