/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { CustomTagConverter } = require('@pia/lib-templatepipeline');
const { parseFragment } = require('parse5');

class PiaConsentInputText extends CustomTagConverter {
  createTextField(value, label) {
    return parseFragment(
      `<div class="wrapper"><span class="text">{{ ${value} }}</span><br><span class="text-label">${label}</span></div><br>`
    ).childNodes[0];
  }
}

module.exports = PiaConsentInputText;
