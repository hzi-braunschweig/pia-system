/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import mapping from './backend-mapping';
import { config } from '../config';

/**
 * Check if passed in prefix exists in mapping json file.
 *
 * @param prefix
 */
export function hasExistingPseudonymPrefix(prefix: string): boolean {
  prefix = prefix.replace(/-+$/, '');
  const backendUrl = config.backendApiUrl.replace(/\/+$/, '');

  return mapping.some((item) => {
    const mappingUrl = item.url.replace(/\/+$/, '');
    return item.prefix === prefix && backendUrl === mappingUrl;
  });
}
