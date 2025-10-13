/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createFormQuestionnaire } from '../psa.app.core/models/instance.helper.spec';
import { generateExportDataFrom } from './questioinnaire-exporter';

describe('Questionnaire Exporter', () => {
  it('should generate export data correctly', () => {
    const formQuestionnaire = createFormQuestionnaire({
      name: 'Testquestionnaire',
    });
    const result = generateExportDataFrom(formQuestionnaire, []);
    expect(result.name).toBe('Testquestionnaire');
    expect(Array.isArray(result.questions)).toBeTrue();
    expect(result.questions.length).toBe(1);
    expect(result.questions[0].answer_options.length).toBe(1);
  });
});
