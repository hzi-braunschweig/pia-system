/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ColorPaletteUtility } from './color-palette.utility';

describe('ColorPaletteUtility', () => {
  describe('getColorForIterator', () => {
    it('should return colors endlessly following the order of the defined palette', function () {
      const expectedColors = [
        ColorPaletteUtility.colors[0],
        ColorPaletteUtility.colors[1],
        ColorPaletteUtility.colors[2],
        ColorPaletteUtility.colors[3],
        ColorPaletteUtility.colors[4],
        ColorPaletteUtility.colors[5],
        ColorPaletteUtility.colors[6],
        ColorPaletteUtility.colors[7],
        ColorPaletteUtility.colors[0],
        ColorPaletteUtility.colors[1],
      ];
      for (let i = 0; i < expectedColors.length; i++) {
        expect(ColorPaletteUtility.getColorForIterator(i)).toEqual(
          expectedColors[i]
        );
      }
    });
  });
});
