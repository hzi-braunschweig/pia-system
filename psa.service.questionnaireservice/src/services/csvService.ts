/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import stream from 'stream';
import * as csv from 'csv-stringify';

export class CsvService {
  public static stringify(): stream.Transform {
    return csv.stringify({ header: true, delimiter: ';' });
  }
}
