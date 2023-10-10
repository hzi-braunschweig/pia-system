/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class ColorPaletteUtility {
  public static readonly colors = [
    '#668F31',
    '#8FB744',
    '#ADCF67',
    '#CCE697',
    '#2E90C1',
    '#3AA9E0',
    '#84C7E8',
    '#A9DAF3',
  ];

  public static getColorForIterator(index: number): string {
    return this.colors[index % this.colors.length];
  }
}
