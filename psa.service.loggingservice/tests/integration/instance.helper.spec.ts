/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Response as SuperagentResponse } from 'superagent';

export type Response<T> = Omit<SuperagentResponse, 'body'> & {
  body: T;
};
