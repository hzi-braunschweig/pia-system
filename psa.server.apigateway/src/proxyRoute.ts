/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Upstream {
  host: string;
  serviceName: string;
  port: number;
  path: string;
  protocol: 'http' | 'https';
}

export interface ProxyRoute {
  path: string;
  upstream: Upstream;
}
