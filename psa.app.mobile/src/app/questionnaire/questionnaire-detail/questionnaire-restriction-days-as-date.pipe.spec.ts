import { isFuture, isToday, isPast, differenceInDays } from 'date-fns';

import { QuestionnaireRestrictionDaysAsDatePipe } from './questionnaire-restriction-days-as-date.pipe';

describe('QuestionnaireRestrictionDaysAsDatePipe', () => {
  const pipe = new QuestionnaireRestrictionDaysAsDatePipe();

  it('should transform to a date in the future', () => {
    const now = new Date();
    const result = pipe.transform(5);

    expect(isFuture(result)).toBeTrue();
    expect(differenceInDays(result, now)).toEqual(5);
  });

  it('should transform to a date at the current day', () => {
    const result = pipe.transform(0);

    expect(isToday(result)).toBeTrue();
  });

  it('should transform to a date in the past', () => {
    const now = new Date();
    const result = pipe.transform(-2);

    expect(isPast(result)).toBeTrue();
    expect(differenceInDays(result, now)).toEqual(-2);
  });

  it('should return null if no value is passed', () => {
    const result = pipe.transform(undefined);
    expect(result).toBeNull();
  });
});
