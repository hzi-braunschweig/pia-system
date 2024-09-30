/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * We often use `Pick<T>`, `Omit<T>`, etc. to create specific types for DTOs.
 * When tsoa renders the routes and documentation, it creates names for your
 * custom types by serializing the type definition into a string.
 *
 * `Expand<T>` used as a helper to expand a type by its keys.
 * The type definition will be hidden for tsoa and the name will be what you
 * originally defined.
 *
 * It is a workaround until tsoa implements inline type aliases:
 * @see https://github.com/lukeautry/tsoa/issues/911.
 *
 * Example:
 * export interface MyPreciselyNamedDto extends Expand<Omit<MyEntity, 'field1' | 'field2'>> {
 */
export type Expand<T> = { [K in keyof T]: T[K] };
