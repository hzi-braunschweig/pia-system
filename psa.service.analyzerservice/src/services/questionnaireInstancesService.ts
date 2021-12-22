/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  add,
  addDays,
  addHours,
  addMonths,
  addWeeks,
  isEqual,
  set,
  setDay,
  startOfToday,
} from 'date-fns';
import { db, pgp } from '../db';
import {
  CycleUnit,
  Questionnaire,
  QuestionnaireType,
  Weekday,
} from '../models/questionnaire';
import {
  BaseQuestionnaireInstance,
  QuestionnaireInstance,
  QuestionnaireInstanceNew,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { Proband } from '../models/proband';
import { Answer } from '../models/answer';
import { Condition } from '../models/condition';
import { AnswerType } from '../models/answerOption';
import { LoggingService } from './loggingService';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { config } from '../config';

interface QuestionnaireInstanceStatusWithIdentifier {
  id: number;
  status: QuestionnaireInstanceStatus;
}

interface CycleSettings {
  cycleUnit: CycleUnit;
  cyclePerDay: number;
  cycleFirstHour: number;
  cycleAmount: number;
  cycleWeekday: Weekday | null;
}

/**
 * @description check and create questionnaire instances
 */
export class QuestionnaireInstancesService {
  private static readonly logger = new LoggingService(
    'QuestionnaireInstancesService'
  );

  private static readonly HOURS_PER_DAY = 24;

  private static readonly DEFAULT_TIME_HOURS = 23;
  private static readonly DEFAULT_TIME_MIN = 59;
  private static readonly DEFAULT_TIME_SEC = 59;
  private static readonly DEFAULT_TIME_MS = 0;

  private static readonly csAnswers = new pgp.helpers.ColumnSet(
    [
      'questionnaire_instance_id',
      'question_id',
      'answer_option_id',
      'versioning',
      'value',
    ],
    { table: 'answers' }
  );

  private static readonly csQuestionnaireInstances = new pgp.helpers.ColumnSet(
    ['?id', 'status'],
    { table: 'questionnaire_instances' }
  );

  /**
   * Activates all questionnaire instances that have to be activated
   */
  public static async checkAndUpdateQuestionnaireInstancesStatus(): Promise<void> {
    this.logger.info('Checking Questionnaire Instances...');

    await db.tx(async (t) => {
      const qInstances: BaseQuestionnaireInstance[] = await t.manyOrNone(`
                SELECT qi.id,
                       qi.date_of_issue,
                       qi.status,
                       qi.date_of_release_v1,
                       qi.user_id,
                       questionnaires.cycle_unit,
                       questionnaires.expires_after_days,
                       questionnaires.finalises_after_days,
                       questionnaires.type,
                       questionnaires.id        AS questionnaire_id,
                       qi.questionnaire_version AS questionnaire_version,
                       questionnaires.name      AS questionnaire_name
                FROM questionnaire_instances AS qi
                         JOIN questionnaires
                              ON qi.questionnaire_id = questionnaires.id AND
                                 qi.questionnaire_version = questionnaires.version
                WHERE (status = 'inactive' OR status = 'active' OR status = 'in_progress' OR
                       status = 'released_once')
                  AND date_of_issue <= NOW()`);

      const vQuestionnaireInstances: QuestionnaireInstanceStatusWithIdentifier[] =
        [];
      const instanceIdsToExpire: number[] = [];
      const instanceIdsToReleaseTwice: number[] = [];
      let deletedQueues = [];
      let deletedSchedules = [];

      this.logger.info(`Found ${qInstances.length} instances to check`);

      if (qInstances.length > 0) {
        const curDate = new Date();
        qInstances.forEach((qInstance: BaseQuestionnaireInstance) => {
          // Expire instance
          if (
            (qInstance.status === 'inactive' ||
              qInstance.status === 'active' ||
              qInstance.status === 'in_progress') &&
            QuestionnaireInstancesService.isExpired(
              curDate,
              qInstance.date_of_issue,
              qInstance.expires_after_days
            ) &&
            qInstance.cycle_unit !== 'spontan' &&
            qInstance.type === 'for_probands'
          ) {
            vQuestionnaireInstances.push({
              id: qInstance.id,
              status: 'expired',
            });
            instanceIdsToExpire.push(qInstance.id);
          }
          // Activate instance
          else if (
            qInstance.status === 'inactive' &&
            qInstance.date_of_issue <= curDate
          ) {
            vQuestionnaireInstances.push({
              id: qInstance.id,
              status: 'active',
            });
          }

          // Release instance twice
          else if (
            qInstance.status === 'released_once' &&
            qInstance.date_of_release_v1 &&
            addDays(
              qInstance.date_of_release_v1,
              qInstance.finalises_after_days
            ) < curDate
          ) {
            instanceIdsToReleaseTwice.push(qInstance.id);
          }
        });
        if (instanceIdsToReleaseTwice.length > 0) {
          await t.none(
            'UPDATE questionnaire_instances SET date_of_release_v2 = date_of_release_v1, status=$1 WHERE id IN($2:csv)',
            ['released_twice', instanceIdsToReleaseTwice]
          );
          const v1Answers = await t.manyOrNone(
            'SELECT questionnaire_instance_id, question_id, answer_option_id, 2 as versioning, value FROM answers WHERE questionnaire_instance_id IN($1:csv) AND versioning=1',
            [instanceIdsToReleaseTwice]
          );
          await t.none(
            'DELETE FROM answers WHERE questionnaire_instance_id IN($1:csv) AND versioning=2',
            [instanceIdsToReleaseTwice]
          );
          this.logger.info(
            `Finalized ${instanceIdsToReleaseTwice.length} instances. New status is "released_twice".`
          );
          if (v1Answers.length > 0) {
            const qAnswers = pgp.helpers.insert(
              v1Answers,
              QuestionnaireInstancesService.csAnswers
            );
            await t.none(qAnswers);
            this.logger.info(
              `Copied ${v1Answers.length} answers as version 2 for questionnaire instances that were finalized`
            );
          }
        }
        if (vQuestionnaireInstances.length > 0) {
          const qUpdateQuestionnaireInstances = `${
            pgp.helpers.update(
              vQuestionnaireInstances,
              QuestionnaireInstancesService.csQuestionnaireInstances
            ) as string
          }WHERE v.id = t.id RETURNING *`;
          await t.many(qUpdateQuestionnaireInstances);
        }
        if (instanceIdsToExpire.length > 0) {
          deletedQueues = await t.manyOrNone(
            'DELETE FROM questionnaire_instances_queued WHERE questionnaire_instance_id IN($1:csv) RETURNING *',
            [instanceIdsToExpire]
          );
          deletedSchedules = await t.manyOrNone(
            'DELETE FROM notification_schedules WHERE notification_type=$1 AND reference_id::integer IN($2:csv) RETURNING *',
            ['qReminder', instanceIdsToExpire]
          );
        }
      }
      this.logger.info(
        `Deleted ${deletedQueues.length} Queues and ${deletedSchedules.length} schedules for expired instances`
      );
      this.logger.info(
        `Activated or expired ${vQuestionnaireInstances.length} Questionnaire Instances!`
      );
    });
  }

  /**
   * Creates the next questionnaire instance for the given questionnaire instance
   */
  public static createNextQuestionnaireInstance(
    questionnaire: Questionnaire,
    instance: QuestionnaireInstance
  ): QuestionnaireInstanceNew {
    const cycleSettings: CycleSettings = {
      cycleUnit: questionnaire.cycle_unit,
      cyclePerDay: questionnaire.cycle_per_day ?? this.HOURS_PER_DAY,
      cycleFirstHour: questionnaire.cycle_first_hour ?? 0,
      cycleAmount: questionnaire.cycle_amount,
      cycleWeekday: questionnaire.notification_weekday,
    };

    const zonedDateOfIssue = this.calculateDateOfIssue(
      utcToZonedTime(instance.date_of_issue, config.timeZone),
      cycleSettings
    );
    const dateOfIssue = zonedTimeToUtc(zonedDateOfIssue, config.timeZone);
    return {
      study_id: instance.study_id,
      questionnaire_id: instance.questionnaire_id,
      questionnaire_version: instance.questionnaire_version,
      questionnaire_name: instance.questionnaire_name,
      user_id: instance.user_id,
      date_of_issue: dateOfIssue,
      cycle: instance.cycle + 1,
      status: this.getQuestionnaireInstanceStatus(
        dateOfIssue,
        questionnaire.expires_after_days,
        questionnaire.cycle_unit,
        questionnaire.type
      ),
    };
  }

  /**
   * Creates questionnaire instances for the given (questionnaire,user) tuple
   */
  public static createQuestionnaireInstances(
    questionnaire: Questionnaire,
    user: Proband,
    hasInternalCondition: boolean,
    onlyLoginDependantOnes = false
  ): QuestionnaireInstanceNew[] {
    return this.getIssueDatesForQuestionnaireInstances(
      questionnaire,
      user,
      hasInternalCondition,
      onlyLoginDependantOnes
    )
      .map((zonedIssueDate) => zonedTimeToUtc(zonedIssueDate, config.timeZone))
      .map((issueDate, index) => ({
        study_id: questionnaire.study_id,
        questionnaire_id: questionnaire.id,
        questionnaire_version: questionnaire.version,
        questionnaire_name: questionnaire.name,
        user_id: user.pseudonym,
        date_of_issue: issueDate,
        cycle: index + 1,
        status: this.getQuestionnaireInstanceStatus(
          issueDate,
          questionnaire.expires_after_days,
          questionnaire.cycle_unit,
          questionnaire.type
        ),
      }));
  }

  /**
   * Returns true if the value of answer meets the condition, false otherwise
   */
  public static isConditionMet(
    answer: Answer | undefined,
    condition: Condition,
    type: AnswerType
  ): boolean {
    if (!answer) {
      return false;
    }
    const answer_values: (string | number | Date)[] = this.parseValues(
      answer.value,
      type
    );
    const condition_values: (string | number | Date)[] = this.parseValues(
      condition.condition_value,
      type
    );
    const condition_link = condition.condition_link ?? 'OR';

    switch (condition.condition_operand) {
      case '<':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '>':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '<=':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '>=':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '==':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '\\=':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Returns true if either the expiration date is reached
   *
   *
   */
  public static isExpired(
    curDate: Date,
    dateOfIssue: Date,
    expires_after_days: number
  ): boolean {
    const questionnaireExpirationDate = addDays(
      dateOfIssue,
      expires_after_days
    );
    return questionnaireExpirationDate < curDate;
  }

  /**
   * Creates date objects for the given (questionnaire,user) tuple
   */
  private static getIssueDatesForQuestionnaireInstances(
    questionnaire: Questionnaire,
    user: Proband,
    hasInternalCondition: boolean,
    onlyLoginDependantOnes: boolean
  ): Date[] {
    if (
      (user.first_logged_in_at === null &&
        questionnaire.cycle_unit !== 'date' &&
        questionnaire.type !== 'for_research_team') ||
      (onlyLoginDependantOnes &&
        (questionnaire.cycle_unit === 'date' ||
          questionnaire.type === 'for_research_team'))
    ) {
      return [];
    }

    const offsetDays = questionnaire.activate_after_days;
    const durationDays = questionnaire.deactivate_after_days;
    const cycleAmount = questionnaire.cycle_amount;
    const cycleUnit = questionnaire.cycle_unit;
    const cyclePerDay = questionnaire.cycle_per_day ?? this.HOURS_PER_DAY;
    const cycleFirstHour = questionnaire.cycle_first_hour ?? 0;
    const notificationWeekday = questionnaire.notification_weekday;
    const activateAtDate = questionnaire.activate_at_date;
    const datesResult = [];

    let startDate = new Date(
      cycleUnit === 'date'
        ? activateAtDate
        : questionnaire.type === 'for_research_team'
        ? new Date(questionnaire.created_at)
        : Math.max(
            (user.first_logged_in_at ?? new Date()).getTime(),
            questionnaire.created_at.getTime()
          )
    );
    // Set the hour of the QI to the hour configured in questionnaire or the default notification time
    startDate.setHours(0, 0, 0, 0);
    if (cycleUnit !== 'spontan') {
      if (cycleUnit === 'hour') {
        startDate = addHours(startDate, cycleFirstHour);
      } else {
        startDate = add(startDate, config.notificationTime);
      }
    }

    if (
      cycleUnit === 'once' ||
      hasInternalCondition ||
      cycleAmount < 1 ||
      cycleUnit === 'date' ||
      cycleUnit === 'spontan'
    ) {
      let newDate =
        cycleUnit === 'date' ? startDate : addDays(startDate, offsetDays);
      // If a weekday for the notification is set, postpone the instance date to this weekday
      if (
        (cycleUnit === 'week' || cycleUnit === 'month') &&
        notificationWeekday
      ) {
        newDate = this.getNextWeekday(newDate, notificationWeekday);
      }

      datesResult.push(newDate);
    } else {
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
    }
    return datesResult;
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
      return QuestionnaireInstancesService.addHours;
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

  private static parseValues(
    values: string,
    type: AnswerType
  ): (string | number | Date)[] {
    if (type === AnswerType.Number) {
      return values.split(';').map((value) => parseFloat(value));
    } else if (type === AnswerType.Date) {
      return values.split(';').map((value) => new Date(value));
    } else {
      return values.split(';');
    }
  }

  private static calculateDateOfIssue(
    oldIssueDate: Date,
    settings: CycleSettings
  ): Date {
    switch (settings.cycleUnit) {
      case 'spontan': {
        return startOfToday();
      }
      case 'hour': {
        let newIssueDate = new Date(oldIssueDate);
        if (
          this.isDayLimitReached(
            newIssueDate.getHours(),
            settings.cyclePerDay,
            settings.cycleFirstHour,
            settings.cycleAmount
          )
        ) {
          newIssueDate = addDays(newIssueDate, 1);
        } else {
          newIssueDate = addHours(newIssueDate, settings.cycleAmount);
        }

        // If new day, set hour to cycle_first_hour
        if (
          newIssueDate.getDate() !== oldIssueDate.getDate() &&
          // Prevent infinite loops when cycle_first_hour is negative
          (settings.cycleFirstHour > 0 ||
            this.HOURS_PER_DAY - oldIssueDate.getHours() !==
              -settings.cycleFirstHour)
        ) {
          newIssueDate = set(newIssueDate, {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          });
          newIssueDate = addHours(newIssueDate, settings.cycleFirstHour);
        }
        return newIssueDate;
      }
      case 'day': {
        return addDays(oldIssueDate, settings.cycleAmount);
      }
      case 'week': {
        return addWeeks(oldIssueDate, settings.cycleAmount);
      }
      case 'month': {
        let newIssueDate = addMonths(oldIssueDate, settings.cycleAmount);
        if (settings.cycleWeekday) {
          newIssueDate = this.getNextWeekday(
            newIssueDate,
            settings.cycleWeekday
          );
        }
        return newIssueDate;
      }
      case 'date':
      case 'once': {
        // this case should actually never happen, as there is no old instance
        // of a questionnaire with cycle unit "once" or "date"
        console.warn(
          'QuestionnaireInstancesService#calculateDateOfIssue: tried to calculate date of issue for a questionnaire with cycle unit "once" or "date". This should never happen.'
        );
        return oldIssueDate;
      }
    }
  }

  private static getQuestionnaireInstanceStatus(
    dateOfIssue: Date,
    expiresAfterDays: number,
    cycleUnit: CycleUnit,
    questionnaireType: QuestionnaireType
  ): QuestionnaireInstanceStatus {
    const curDate = new Date();
    if (dateOfIssue <= curDate) {
      if (
        this.isExpired(curDate, dateOfIssue, expiresAfterDays) &&
        cycleUnit !== 'spontan' &&
        questionnaireType === 'for_probands'
      ) {
        return 'expired';
      } else {
        return 'active';
      }
    } else {
      return 'inactive';
    }
  }

  /**
   * Returns the date with the next given weekday
   */
  private static getNextWeekday(date: Date, weekday: Weekday): Date {
    const newDate = setDay(date, this.getDayNumberFromName(weekday));
    if (newDate < date) {
      return addWeeks(newDate, 1);
    }
    return newDate;
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

  private static isDayLimitReached(
    curHour: number,
    cyclePerDay: number,
    cycleFirstHour: number,
    cycleAmount: number
  ): boolean {
    return (curHour - cycleFirstHour) / cycleAmount + 1 >= cyclePerDay;
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
        QuestionnaireInstancesService.HOURS_PER_DAY - oldDate.getHours() !==
          -cycle_first_hour)
    ) {
      newDate.setHours(0, 0, 0, 0);
      newDate = addHours(newDate, cycle_first_hour);
    }
    return newDate;
  }
}
