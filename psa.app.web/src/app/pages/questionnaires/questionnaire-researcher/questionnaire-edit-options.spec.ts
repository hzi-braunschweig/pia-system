/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireEditOptions } from './questionnaire-edit-options';

describe('QuestionnaireEditOptions', () => {
  it('should provide options for questionnaire edit mode', () => {
    expect(QuestionnaireEditOptions.conditionLinks).toBeDefined();
    expect(QuestionnaireEditOptions.conditionOperands).toBeDefined();
    expect(QuestionnaireEditOptions.questionnaireTypes).toBeDefined();
    expect(QuestionnaireEditOptions.questionnaireTypes).toContain({
      value: 'for_research_team',
      viewValue: 'QUESTIONNAIRE_FORSCHER.TYPE_FOR_RESEARCH_TEAM',
    });
  });

  describe('getHoursOfDay()', () => {
    let getTimezoneOffsetSpy: jasmine.Spy<Date['getTimezoneOffset']>;
    beforeEach(() => {
      getTimezoneOffsetSpy = spyOn<Date, 'getTimezoneOffset'>(
        Date.prototype,
        'getTimezoneOffset'
      ).and.returnValue(-120);
    });
    it('should provide a list of hours of a day', () => {
      const hoursOfDay = QuestionnaireEditOptions.getHoursOfDay('Uhr');
      expect(hoursOfDay.length).toBe(24);
      expect(hoursOfDay).toContain({ value: 12, viewValue: '14 Uhr' });
      expect(hoursOfDay).toContain({ value: 18, viewValue: '20 Uhr' });
      expect(getTimezoneOffsetSpy).toHaveBeenCalled();
    });

    it('should prefix single digit hours with a zero', () => {
      const hoursOfDay = QuestionnaireEditOptions.getHoursOfDay('Uhr');
      expect(hoursOfDay.length).toBe(24);
      expect(hoursOfDay).toContain({ value: -2, viewValue: '00 Uhr' });
      expect(hoursOfDay).toContain({ value: 5, viewValue: '07 Uhr' });
      expect(getTimezoneOffsetSpy).toHaveBeenCalled();
    });
  });
});
