/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Tools } from './tools';

describe('Questionnaire tools', () => {
  it('should test getting the right answer option', () => {
    expect(Tools.getAnswerVersion('active', 2, 1)).toEqual(2);
    expect(Tools.getAnswerVersion('in_progress', 2, 1)).toEqual(2);
    expect(Tools.getAnswerVersion('released_once', 1, 1)).toEqual(2);
    expect(Tools.getAnswerVersion('released', 1, 1)).toEqual(2);
    expect(Tools.getAnswerVersion('released_once', 0, 2)).toEqual(1);
    expect(Tools.getAnswerVersion('released', 0, 2)).toEqual(1);
  });
});
