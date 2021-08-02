/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class StatusCode {
  public static readonly GROUP_DIVIDER = 100;
  public static readonly GROUP_SUCCESS = 2;
  public static readonly GROUP_REDIRECTION = 3;
  public static readonly GROUP_CLIENT_ERROR = 4;
  public static readonly GROUP_SERVER_ERROR = 5;

  public static readonly OK = 200;

  public static readonly MOVED_PERMANENTLY = 301;

  public static readonly NOT_FOUND = 404;

  public static readonly BAD_GATEWAY = 502;

  public static readonly MAX = 999;
}
