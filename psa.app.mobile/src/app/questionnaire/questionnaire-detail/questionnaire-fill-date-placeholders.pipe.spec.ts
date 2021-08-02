/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireFillDatePlaceholdersPipe } from './questionnaire-fill-date-placeholders.pipe';

describe('QuestionnaireFillDatePlaceholdersPipe', () => {
  it('create an instance', () => {
    const pipe = new QuestionnaireFillDatePlaceholdersPipe();
    expect(pipe).toBeTruthy();
  });
});
