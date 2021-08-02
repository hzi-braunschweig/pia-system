/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { HttpConnection } from './configModel';

describe('HttpConnection', () => {
  it('should return an url string', () => {
    const port = 80;
    const conn = new HttpConnection('http', 'localhost', port);
    expect(conn.url).to.eql('http://localhost:80');
  });
});
