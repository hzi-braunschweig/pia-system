/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Mark params or return types as nullable
 *
 * @example
 * function getSomething(id: string): Nullable<Something> {}
 */
export type Nullable<T> = T | null;

/**
 * Like the default Partial<T> except that nested elements are also partial.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};
