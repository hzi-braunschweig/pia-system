/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const Directory = {
  Data: 'DATA',
};

export const Filesystem = {
  async writeFile({
    directory,
    path,
    data,
    recursive,
  }: {
    directory: string;
    path: string;
    data: string;
    recursive?: boolean;
  }): Promise<{ uri: string }> {
    return { uri: 'path' };
  },
};
