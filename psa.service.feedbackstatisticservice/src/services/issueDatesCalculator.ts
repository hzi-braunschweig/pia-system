/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { add, addDays, addHours, addMonths, addWeeks, setDay } from 'date-fns';
import { QuestionnaireSettings, Weekday } from './relativeFrequencyTimeSeries';
import { config } from '../config';

export class IssueDatesCalculator {
  private static readonly HOURS_PER_DAY = 24;
  private static readonly DEFAULT_TIME_HOURS = 23;
  private static readonly DEFAULT_TIME_MIN = 59;
  private static readonly DEFAULT_TIME_SEC = 59;
  private static readonly DEFAULT_TIME_MS = 0;

  public static getFromQuestionnaireSettings(
    questionnaire: QuestionnaireSettings
  ): Date[] {
    return this.getIssueDates(questionnaire);
  }

  private static getIssueDates(questionnaire: QuestionnaireSettings): Date[] {
    const offsetDays = questionnaire.activateAfterDays;
    const durationDays = questionnaire.deactivateAfterDays;
    const cycleAmount = questionnaire.cycleAmount;
    const cycleUnit = questionnaire.cycleUnit;
    const cyclePerDay = questionnaire.cyclePerDay ?? this.HOURS_PER_DAY;
    const cycleFirstHour = questionnaire.cycleFirstHour ?? 0;
    const notificationWeekday = questionnaire.notificationWeekday;
    const datesResult = [];

    if (
      !cycleUnit ||
      cycleUnit === 'once' ||
      cycleUnit === 'spontan' ||
      !cycleAmount
    ) {
      throw new Error('Unsupported cycle');
    }

    let startDate = new Date(questionnaire.createdAt ?? new Date());
    // Set the hour of the QI to the hour configured in questionnaire or the default notification time
    startDate.setHours(0, 0, 0, 0);
    if (cycleUnit === 'hour') {
      startDate = addHours(startDate, cycleFirstHour);
    } else {
      startDate = add(startDate, config.notificationTime);
    }

    const max = addDays(startDate, offsetDays + durationDays);

    max.setHours(
      this.DEFAULT_TIME_HOURS,
      this.DEFAULT_TIME_MIN,
      this.DEFAULT_TIME_SEC,
      this.DEFAULT_TIME_MS
    );
    let datesOnCurrentDay = 0;
    let lastDate = null;

    if (cycleUnit === 'month') {
      const offsetDate = addDays(startDate, offsetDays);
      let currentDate = offsetDate;
      let i = 0;
      while (currentDate < max) {
        let newDate = new Date(currentDate);
        // If a weekday for the notification is set, postpone the instance date to this weekday
        if (notificationWeekday) {
          newDate = this.getNextWeekday(newDate, notificationWeekday);
        }
        datesResult.push(newDate);
        lastDate = new Date(currentDate);

        i++;
        currentDate = addMonths(offsetDate, cycleAmount * i);
      }
    } else {
      const incrementFunc = this.getIncrementFunction(cycleUnit);
      for (
        let i = addDays(startDate, offsetDays);
        i <= max;
        i = incrementFunc(
          i,
          cycleAmount,
          cycleFirstHour,
          datesOnCurrentDay >= cyclePerDay
        )
      ) {
        if (cycleUnit === 'hour') {
          const lastDayWithOffset = lastDate
            ? addHours(
                new Date(lastDate),
                cycleFirstHour < 0 ? -cycleFirstHour : 0
              ).getDate()
            : null;
          const curDayWithOffset = addHours(
            new Date(i),
            cycleFirstHour < 0 ? -cycleFirstHour : 0
          ).getDate();
          if (!lastDate || lastDayWithOffset === curDayWithOffset) {
            datesOnCurrentDay++;
          } else {
            datesOnCurrentDay = 1;
          }
        }

        let newDate = new Date(i);
        // If a weekday for the notification is set, postpone the instance date to this weekday
        if (cycleUnit === 'week' && notificationWeekday) {
          newDate = this.getNextWeekday(newDate, notificationWeekday);
        }
        datesResult.push(newDate);
        lastDate = new Date(i);
      }
    }
    return datesResult;
  }

  private static getDayNumberFromName(weekdayName: Weekday): number {
    const weekdays: Weekday[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return weekdays.indexOf(weekdayName);
  }

  private static getNextWeekday(date: Date, weekday: Weekday): Date {
    const newDate = setDay(date, this.getDayNumberFromName(weekday));
    if (newDate < date) {
      return addWeeks(newDate, 1);
    }
    return newDate;
  }

  private static getIncrementFunction(
    cycleUnit: 'day' | 'week' | 'hour'
  ): (
    date: Date,
    amount: number,
    cycle_first_hour: number,
    dayLimitReached: boolean
  ) => Date {
    if (cycleUnit === 'hour') {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      return this.addHours;
    } else {
      return (date: Date, amount: number): Date => {
        if (cycleUnit === 'day') {
          return addDays(date, amount);
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (cycleUnit === 'week') {
          return addWeeks(date, amount);
        }
        return new Date(date);
      };
    }
  }

  private static addHours(
    this: void,
    date: Date,
    hours: number,
    cycle_first_hour: number,
    dayLimitReached: boolean
  ): Date {
    const oldDate = new Date(date);
    let newDate = new Date(date);

    if (!dayLimitReached) {
      newDate = addHours(newDate, hours);
    } else {
      newDate = addDays(newDate, 1);
    }

    // Day changed, set time to cycle_first_hour
    if (
      oldDate.getDate() !== newDate.getDate() &&
      // Prevent infinite loop when cycle_first_hour is negative
      (cycle_first_hour > 0 ||
        IssueDatesCalculator.HOURS_PER_DAY - oldDate.getHours() !==
          -cycle_first_hour)
    ) {
      newDate.setHours(0, 0, 0, 0);
      newDate = addHours(newDate, cycle_first_hour);
    }
    return newDate;
  }
}
