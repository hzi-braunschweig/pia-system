/*
 * SPDX-FileCopyrightText: 2026 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const store: Record<string, string> = {};

export const Preferences = {
  async get(options: { key: string }): Promise<{ value: string | null }> {
    return { value: store[options.key] ?? null };
  },
  async set(options: { key: string; value: string }): Promise<void> {
    store[options.key] = options.value;
  },
  async remove(options: { key: string }): Promise<void> {
    delete store[options.key];
  },
  async clear(): Promise<void> {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  },
};
