/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const Badge = {
  async set(data: { count: number }): Promise<void> {},
  async clear(): Promise<void> {},
  async get(): Promise<{ count: number }> {
    return { count: 0 };
  },
};
