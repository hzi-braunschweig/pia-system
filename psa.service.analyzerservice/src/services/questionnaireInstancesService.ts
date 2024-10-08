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
  set,
  setDay,
  startOfToday,
} from 'date-fns';
import { db, pgp } from '../db';
import { CycleUnit, Questionnaire, Weekday } from '../models/questionnaire';
import {
  BaseQuestionnaireInstance,
  QuestionnaireInstance,
  QuestionnaireInstanceNew,
  QuestionnaireInstanceStatus,
  QuestionnaireInstanceQuestionnairePair,
} from '../models/questionnaireInstance';
import { Proband } from '../models/proband';
import { LoggingService } from './loggingService';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { config } from '../config';
import { ITask } from 'pg-promise';
import {
  messageQueueService,
  QuestionnaireInstanceMessageFn,
} from './messageQueueService';
import {
  AnswerWithQuestionnaireInstance,
  AnswerWithCondition,
  Answer,
} from '../models/answer';
import { AnswerOption } from '../models/answerOption';
import { Condition } from '../models/condition';
import { CreateQuestionnaireInstanceInternalDto } from '@pia-system/lib-http-clients-internal';

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

  private static readonly csQuestionnaireInstancesStatus =
    new pgp.helpers.ColumnSet(['?id', 'status'], {
      table: 'questionnaire_instances',
    });

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
                       qi.study_id,
                       questionnaires.cycle_unit,
                       questionnaires.expires_after_days,
                       questionnaires.finalises_after_days,
                       questionnaires.type,
                       questionnaires.id          AS questionnaire_id,
                       qi.questionnaire_version   AS questionnaire_version,
                       questionnaires.name        AS questionnaire_name,
                       questionnaires.custom_name AS questionnaire_custom_name
                FROM questionnaire_instances AS qi
                         JOIN questionnaires
                              ON qi.questionnaire_id = questionnaires.id AND
                                 qi.questionnaire_version = questionnaires.version
                WHERE (status = 'inactive' OR status = 'active' OR status = 'in_progress' OR
                       status = 'released_once')
                  AND date_of_issue <= NOW()`);

      const vQuestionnaireInstances: QuestionnaireInstanceQuestionnairePair<BaseQuestionnaireInstance>[] =
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
            this.isQuestionnaireInstanceExpired(
              qInstance.date_of_issue,
              qInstance
            )
          ) {
            vQuestionnaireInstances.push({
              questionnaireInstance: {
                ...qInstance,
                status: 'expired',
              },
              questionnaire: {
                id: qInstance.questionnaire_id,
                custom_name: qInstance.questionnaire_custom_name,
              },
            });
            instanceIdsToExpire.push(qInstance.id);
          }
          // Activate instance
          else if (
            qInstance.status === 'inactive' &&
            qInstance.date_of_issue <= curDate
          ) {
            vQuestionnaireInstances.push({
              questionnaireInstance: {
                ...qInstance,
                status: 'active',
              },
              questionnaire: {
                id: qInstance.questionnaire_id,
                custom_name: qInstance.questionnaire_custom_name,
              },
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
          await this.updateQuestionnaireInstances(t, vQuestionnaireInstances);
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

  public static async getAnswerOption(
    t: ITask<unknown>,
    id: number
  ): Promise<AnswerOption> {
    return t.one('SELECT * FROM answer_options WHERE id=$1', [id]);
  }

  public static async getLatestAnswersForCondition(
    t: ITask<unknown>,
    proband: Proband,
    qCondition: Condition
  ): Promise<AnswerWithQuestionnaireInstance[]> {
    return t.manyOrNone(
      'SELECT * FROM answers,questionnaire_instances WHERE answers.questionnaire_instance_id=questionnaire_instances.id AND user_id=$1 AND answer_option_id=$2 AND cycle=ANY(SELECT MAX(cycle) FROM questionnaire_instances WHERE user_id=$1 AND questionnaire_id=$3 AND questionnaire_version=$4 AND (questionnaire_instances.status IN ($5, $6, $7))) ORDER BY versioning',
      [
        proband.pseudonym,
        qCondition.condition_target_answer_option,
        qCondition.condition_target_questionnaire,
        qCondition.condition_target_questionnaire_version,
        'released_once',
        'released_twice',
        'relesed',
      ]
    );
  }

  public static async getAnswer(
    t: ITask<unknown>,
    instanceId: number,
    answerOptionId: number,
    answerVersion: number
  ): Promise<Answer | null> {
    return t.oneOrNone(
      'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
      [instanceId, answerOptionId, answerVersion]
    );
  }

  public static async getAnswersWithCondition(
    t: ITask<unknown>,
    instanceId: number,
    answerVersion: number
  ): Promise<AnswerWithCondition[]> {
    return t.manyOrNone(
      `SELECT value,
                  answer_option_id,
                  c.id AS condition_id,
                  questionnaire_instance_id,
                  condition_questionnaire_id,
                  condition_questionnaire_version,
                  condition_type,
                  condition_value,
                  condition_link,
                  condition_operand
           FROM answers AS a
                  JOIN conditions AS c ON
             a.answer_option_id = c.condition_target_answer_option
                  JOIN (SELECT id,
                               MAX(version) AS version
                        FROM questionnaires
                        GROUP BY id) AS q ON
               c.condition_questionnaire_id = q.id
               AND c.condition_questionnaire_version = q.version
           WHERE a.questionnaire_instance_id = $(questionnaireInstanceId)
             AND a.versioning = $(answerVersion)`,
      {
        questionnaireInstanceId: instanceId,
        answerVersion: answerVersion,
      }
    );
  }

  /**
   * Creates the next questionnaire instance for the given questionnaire instance
   */
  public static createNextQuestionnaireInstance(
    questionnaire: Questionnaire,
    instance: QuestionnaireInstance
  ): CreateQuestionnaireInstanceInternalDto {
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
    const nextInstance: CreateQuestionnaireInstanceInternalDto = {
      studyId: instance.study_id,
      questionnaireId: instance.questionnaire_id,
      questionnaireVersion: instance.questionnaire_version,
      questionnaireName: instance.questionnaire_name,
      sortOrder: instance.sort_order,
      pseudonym: instance.user_id,
      dateOfIssue: dateOfIssue,
      cycle: instance.cycle + 1,
      status: 'inactive', // placeholder until we determine the real status
      origin: null,
    };

    nextInstance.status = this.getQuestionnaireInstanceStatus(
      dateOfIssue,
      questionnaire
    );

    return nextInstance;
  }

  public static pairQuestionnaireInstancesWithQuestionnaire<
    T extends QuestionnaireInstanceNew
  >(
    questionnaireInstances: T[],
    questionnaire: Questionnaire
  ): QuestionnaireInstanceQuestionnairePair<T>[] {
    return questionnaireInstances.map(
      (questionnaireInstance): QuestionnaireInstanceQuestionnairePair<T> => ({
        questionnaireInstance,
        questionnaire,
      })
    );
  }

  /**
   * Creates questionnaire instances for the given (questionnaire,user) tuple
   */
  public static createQuestionnaireInstances(
    questionnaire: Questionnaire,
    user: Proband,
    hasInternalCondition: boolean,
    onlyLoginDependantOnes = false
  ): CreateQuestionnaireInstanceInternalDto[] {
    return this.getIssueDatesForQuestionnaireInstances(
      questionnaire,
      user,
      hasInternalCondition,
      onlyLoginDependantOnes
    )
      .map((zonedIssueDate) => zonedTimeToUtc(zonedIssueDate, config.timeZone))
      .map((issueDate, index) => {
        const newInstance: CreateQuestionnaireInstanceInternalDto = {
          studyId: questionnaire.study_id,
          questionnaireId: questionnaire.id,
          questionnaireVersion: questionnaire.version,
          questionnaireName: questionnaire.name,
          sortOrder: questionnaire.sort_order,
          pseudonym: user.pseudonym,
          dateOfIssue: issueDate,
          cycle: index + 1,
          status: 'inactive',
          origin: null,
        };

        newInstance.status = this.getQuestionnaireInstanceStatus(
          issueDate,
          questionnaire
        );

        return newInstance;
      });
  }

  /**
   * Returns true if either the expiration date is reached
   */
  public static isDateExpiredAfterDays(
    current: Date,
    start: Date,
    daysUntilExpiration: number
  ): boolean {
    const expirationDate = addDays(start, daysUntilExpiration);
    return expirationDate < current;
  }

  public static isQuestionnaireInstanceExpired(
    dateOfIssue: Date,
    questionnaireSettings: Pick<
      Questionnaire,
      'expires_after_days' | 'cycle_unit' | 'type'
    >
  ): boolean {
    return (
      questionnaireSettings.cycle_unit !== 'spontan' &&
      questionnaireSettings.type === 'for_probands' &&
      this.isDateExpiredAfterDays(
        new Date(),
        dateOfIssue,
        questionnaireSettings.expires_after_days
      )
    );
  }

  public static async updateQuestionnaireInstances(
    t: ITask<unknown>,
    instancesWithQuestionnaires: QuestionnaireInstanceQuestionnairePair<
      Pick<BaseQuestionnaireInstance, 'id' | 'study_id' | 'user_id' | 'status'>
    >[]
  ): Promise<void> {
    const fieldsOnly = instancesWithQuestionnaires.map((dto) => ({
      id: dto.questionnaireInstance.id,
      status: dto.questionnaireInstance.status,
    }));
    const qUpdateQuestionnaireInstances = pgp.helpers.update(
      fieldsOnly,
      QuestionnaireInstancesService.csQuestionnaireInstancesStatus
    ) as string;

    await t.many(
      `${qUpdateQuestionnaireInstances}WHERE v.id = t.id RETURNING *`
    );

    for (const dto of instancesWithQuestionnaires) {
      const sendMessage = this.getSendMessageMethod(
        dto.questionnaireInstance.status
      );
      if (sendMessage) {
        await sendMessage(dto.questionnaireInstance, dto.questionnaire);
      }
    }
  }

  private static getSendMessageMethod(
    status: QuestionnaireInstanceStatus
  ): QuestionnaireInstanceMessageFn | null {
    switch (status) {
      case 'active':
        return messageQueueService.sendQuestionnaireInstanceActivated.bind(
          messageQueueService
        );
      case 'expired':
        return messageQueueService.sendQuestionnaireInstanceExpired.bind(
          messageQueueService
        );
      default:
        return null;
    }
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
    questionnaireSettings: Pick<
      Questionnaire,
      'expires_after_days' | 'cycle_unit' | 'type'
    >
  ): Extract<QuestionnaireInstanceStatus, 'inactive' | 'active' | 'expired'> {
    const curDate = new Date();
    if (dateOfIssue <= curDate) {
      if (
        this.isQuestionnaireInstanceExpired(dateOfIssue, questionnaireSettings)
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
