/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare module 'himalaya' {
  export interface ParsedElement {
    tagName: string;
    attributes: { key: string; value: string }[];
    children: ParsedElement[] | undefined;
    type: string;
  }

  export function parse(content: string): ParsedElement[] | undefined;
}
