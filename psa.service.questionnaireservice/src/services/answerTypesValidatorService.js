/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pgHelper = require('../services/postgresqlHelper.js');

/**
 * @description Utility Service for validating answer types
 */
const answerTypesValidatorService = (function () {
  const allowedTypesForResearchTeam = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  const allowedTypesForProband = ['image/jpeg', 'image/png'];

  const base64MimeTypeMapping = {
    JVBERi0: 'application/pdf',
    '/9j/4AAQSkZJRgAB': 'image/jpeg',
    iVBORw0KGgo: 'image/png',
  };

  async function validateFileAndImage(answers, role) {
    const answerOptionsIds = answers.map((answer) => answer.answer_option_id);

    const answersOptions = await pgHelper.getAnswerOptionsWithTypes(
      answerOptionsIds
    );

    for (let i = 0; i < answers.length; i++) {
      const answerOption = answersOptions.find(
        (answerOption) => (answerOption.id = answers[i].answer_option_id)
      );
      if (['file', 'image'].includes(answerOption.type) && answers[i].value) {
        const jsonContent = JSON.parse(answers[i].value);
        if (typeof jsonContent === 'object') {
          const base64ContentArray = jsonContent.data.split(',');
          const providedMimeType = base64ContentArray[0].match(
            /[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/
          )[0];
          const base64FileContent = base64ContentArray[1];
          if (isMimeTypeSupported(providedMimeType, base64FileContent, role)) {
            continue;
          } else {
            return false;
          }
        }
      } else {
        // Answer type is neither file nor image, therefore no validation is required
        continue;
      }
    }
    return true;
  }

  function isMimeTypeSupported(mimeType, base64Data, role) {
    // CSV files have do not have a specific signature, nor they have a specific mimetype
    // therefore a type check based on the base64 content is not possible
    if (mimeType.includes('csv') || mimeType === 'application/vnd.ms-excel') {
      return true;
    }

    // Check if mimeType exists based on the file content and user role
    if (role === 'Proband') {
      return detectMimeTypeForProband(base64Data) !== undefined;
    } else if (role === 'Untersuchungsteam') {
      return detectMimeTypeForResearchTeam(base64Data) !== undefined;
    } else {
      // Other roles are not allowed to upload files
      return false;
    }
  }

  function detectMimeTypeForResearchTeam(base64Content) {
    for (const s in base64MimeTypeMapping) {
      if (base64Content.indexOf(s) === 0) {
        if (allowedTypesForResearchTeam.includes(base64MimeTypeMapping[s])) {
          return base64MimeTypeMapping[s];
        }
      }
    }
    return undefined;
  }

  function detectMimeTypeForProband(base64Content) {
    for (const s in base64MimeTypeMapping) {
      if (base64Content.indexOf(s) === 0) {
        if (allowedTypesForProband.includes(base64MimeTypeMapping[s])) {
          return base64MimeTypeMapping[s];
        }
      }
    }
    return undefined;
  }

  return {
    /**
     * validates the file and image answer types
     * @param {array} the answers array
     * @return {Promise<{isValid: boolean}>} A promise that returns ture if valid, otherwise false
     */
    validateFileAndImage: validateFileAndImage,
  };
})();

module.exports = answerTypesValidatorService;
