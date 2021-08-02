/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const PiaConsentInputRadio = require('./piaConsentInputRadio');
const hashService = require('../../services/hashService');
const TemplateGenerationError = require('./errors/templateGenerationError');

class PiaConsentInputRadioGeneric extends PiaConsentInputRadio {
  constructor(i18n) {
    super(i18n);
    this.tagName = 'pia-consent-input-radio-generic';
  }

  convertNode(node) {
    const nameAttr = node.attrs.find((attr) => attr.name === 'name');
    if (!nameAttr) {
      throw new TemplateGenerationError(
        'No name attribute found for generic radio field.'
      );
    }
    const value =
      'genericCompliance.' + hashService.createMd5Hash(nameAttr.value);

    const i = node.parentNode.childNodes.findIndex((child) => child === node);
    const checkbox = this.createCheckbox(value);
    checkbox.parentNode = node.parentNode;
    node.parentNode.childNodes[i] = checkbox;
  }
}

module.exports = PiaConsentInputRadioGeneric;
