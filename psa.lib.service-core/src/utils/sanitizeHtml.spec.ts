/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml()', () => {
  it('should remove malicious code from a html string', () => {
    const result = sanitizeHtml('<img src=x onerror=alert(1)//>');
    expect(result).not.to.include('alert(1)');
  });
});
