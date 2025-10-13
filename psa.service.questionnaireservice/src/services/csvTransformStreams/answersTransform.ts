/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CsvTransform } from './csvTransform';
import { AnswerExportAnswer, AnswerExportDbRow } from '../../models/answer';
import { AnswerStatus, CsvAnswerRow } from '../../models/csvExportRows';
import { DateFormat, ExportUtilities } from '../exportUtilities';
import { AnswerType } from '../../models/answerOption';
import { QuestionnaireInstanceStatus } from '@pia-system/lib-http-clients-internal';
import { ExportMetaInfo } from '../../models/export/exportMetaInfo';
import { ColumnMeta } from '../../models/export/columnMeta';
import { Missing } from '../../models/missing';
import { QuestionMetaInfo } from '../../models/export/questionMetaInfo';
import { ConditionChecker } from '../conditionChecker';
import { ConditionType, DbCondition } from '../../models/condition';
import { Answer } from '../../entities/answer';
import { AnswerOption } from '../../entities/answerOption';
import { QuestionnaireInstance } from '../../entities/questionnaireInstance';
import { SingleSelectMetaInfo } from '../../models/export/singleSelectMetaInfo';
import { MultiSelectMetaInfo } from '../../models/export/multiSelectMetaInfo';
import { SampleIdMetaInfo } from '../../models/export/sampleIdMetaInfo';
import { ColumnMetaInfo } from '../../models/export/columnMetaInfo';
import { ColumnMetaConditions } from '../../models/export/sharedColumnMetaInfo';
import { QuestionnaireInstanceOrigin } from '../../entities/questionnaireInstanceOrigin';
import { dataSource } from '../../db';
import { In, IsNull } from 'typeorm';
import { assert } from 'ts-essentials';

export class AnswersTransform extends CsvTransform<
  AnswerExportDbRow,
  CsvAnswerRow
> {
  public readonly fileIds = new Set<number>();
  private readonly conditionCache = new Map<string, ConditionCheckResult>();
  private readonly baseRow: CsvAnswerRow;
  private readonly releasedStatuses: QuestionnaireInstanceStatus[] = [
    'released',
    'released_once',
    'released_twice',
  ];

  public constructor(private readonly metaInfo: ExportMetaInfo) {
    super();

    this.baseRow = {
      participant: null,
      is_test_participant: null,
      questionnaire_name: this.metaInfo.name ?? '',
      questionnaire_id: this.metaInfo.id ?? 0,
      questionnaire_version: this.metaInfo.version ?? 0,
      questionnaire_cycle: null,
      questionnaire_date_of_issue: null,
      answer_date: null,
      answer_status: null,
    };
  }

  protected async convertToCsvRow(
    row: AnswerExportDbRow
  ): Promise<CsvAnswerRow | undefined> {
    return {
      ...this.baseRow,
      participant: row.participant,
      is_test_participant: ExportUtilities.mapBoolean(row.is_test_participant),
      questionnaire_cycle: row.cycle,
      questionnaire_date_of_issue: ExportUtilities.formatDate(
        row.date_of_issue,
        DateFormat.ISO
      ),
      answer_date: row.answer_date
        ? ExportUtilities.formatDate(row.answer_date, DateFormat.ISO)
        : null,
      answer_status: this.mapAnswerStatus(row.answer_status),
      ...(await this.getAnswerColumns(row)),
    };
  }

  private async getAnswerColumns(
    row: AnswerExportDbRow
  ): Promise<Record<string, string | null>> {
    const rowHasNotBeenReleased =
      !this.rowHasBeenReleased(row) && !this.hasCondition(this.metaInfo);

    if (rowHasNotBeenReleased) {
      return this.createColumns(() => Missing.NotReleased);
    }

    if (this.hasCondition(this.metaInfo)) {
      const conditionCheckResult = await this.wasConditionMet(
        row,
        this.metaInfo.condition
      );

      // former data (before release 1.39.0) does not contain the origin relation
      // therefore, the origin instance cannot be determined
      if (conditionCheckResult.showErrorForOriginRelationNotFound) {
        return this.createColumns(
          async (columnMeta: ColumnMeta) =>
            await this.getValue(columnMeta, row, { showError: true })
        );
      }

      if (!conditionCheckResult.wasConditionMet) {
        return this.createColumns(() => Missing.NotApplicable);
      }
    }

    return this.createColumns(async (columnMeta: ColumnMeta) =>
      this.getValue(columnMeta, row)
    );
  }

  private async getValue(
    columnMeta:
      | ColumnMetaInfo
      | SingleSelectMetaInfo
      | MultiSelectMetaInfo
      | SampleIdMetaInfo,
    row: AnswerExportDbRow,
    options?: { showError?: boolean }
  ): Promise<string | null> {
    let showError = options?.showError ?? false;

    if (this.hasCondition(columnMeta)) {
      const conditionCheckResult = await this.wereConditionsMet(
        row,
        columnMeta.conditions
      );

      if (conditionCheckResult.showErrorForOriginRelationNotFound) {
        showError = true;
      } else if (!conditionCheckResult.wasConditionMet) {
        return Missing.NotApplicable;
      }
    }

    const answer = this.getAnswer(row, columnMeta.answerOptionId);

    const value =
      this.transformValueFromAnswer(columnMeta, answer) ??
      (await this.determineMissing(row, columnMeta));

    return showError ? `Error (value: ${value})` : value;
  }

  private transformValueFromAnswer(
    columnMeta: ColumnMeta,
    answer: AnswerExportAnswer | null
  ): string | null {
    if (!answer?.value) {
      return null;
    }

    switch (columnMeta.answerType) {
      case AnswerType.Image:
      case AnswerType.File:
        if (answer.file_id) {
          this.fileIds.add(answer.file_id);
          return ExportUtilities.composeFileName(
            answer.file_id,
            answer.file_name
          );
        }
        console.error(
          'File reference is missing for user file id:',
          answer.file_id
        );
        return null;
      case AnswerType.Date:
        try {
          return ExportUtilities.formatDateStringWithoutTimeZone(
            answer.value,
            DateFormat.Date
          );
        } catch (e) {
          console.error('Could not parse the date', answer.value);
          console.error('Error: ', e);
          return null;
        }
      case AnswerType.Timestamp:
        try {
          return ExportUtilities.formatDateString(answer.value, DateFormat.ISO);
        } catch (e) {
          console.error('Could not parse the date', answer.value);
          return null;
        }
      case AnswerType.SingleSelect:
        return (
          columnMeta.codes[
            columnMeta.values.findIndex((v) => v === answer.value)
          ] ?? null
        );
      case AnswerType.MultiSelect:
        return answer.value.split(';').find((v) => columnMeta.value === v)
          ? '1'
          : null;
      case AnswerType.Sample:
        return columnMeta.sampleId
          ? answer.value.split(';')[columnMeta.sampleId - 1] ?? null
          : null;
      default:
        return answer.value;
    }
  }

  private mapAnswerStatus(
    status: QuestionnaireInstanceStatus
  ): AnswerStatus | null {
    switch (status) {
      case 'active':
        return AnswerStatus.PendingAnswer;
      case 'expired':
        return AnswerStatus.ExpiredAnswer;
      case 'in_progress':
        return AnswerStatus.InProgressAnswer;
      case 'released':
        return AnswerStatus.LatestStudyAssistantAnswer;
      case 'released_once':
        return AnswerStatus.ModifiableParticipantAnswer;
      case 'released_twice':
        return AnswerStatus.FinalParticipantAnswer;
      default:
        return null;
    }
  }

  private hasCondition(
    row: ColumnMeta | QuestionMetaInfo | ExportMetaInfo
  ): boolean {
    if ('condition' in row) {
      return row.condition !== null;
    }

    return (
      row.conditions.answerOption !== null || row.conditions.question !== null
    );
  }

  private rowHasBeenReleased(answer: AnswerExportDbRow): boolean {
    return this.releasedStatuses.includes(answer.answer_status);
  }

  /**
   * Determines missings on level of questions and answer options.
   * Missings which can be determined on level of questionnaire are
   * handled before calling this method.
   *
   * It does not check if the value is null,you need to do this yourself beforehand.
   */
  private async determineMissing(
    row: AnswerExportDbRow,
    columnMeta: ColumnMeta
  ): Promise<Missing> {
    let missingDueToConditionNotMet = false;
    if (this.hasCondition(columnMeta)) {
      const wereConditionsMet = await this.wereConditionsMet(
        row,
        columnMeta.conditions
      );

      if (
        !wereConditionsMet.showErrorForOriginRelationNotFound &&
        !wereConditionsMet.wasConditionMet
      ) {
        missingDueToConditionNotMet = true;
      }
    }

    if (missingDueToConditionNotMet) {
      if (!columnMeta.isMandatory) {
        return Missing.Unobtainable;
      }

      return Missing.NotApplicable;
    }

    if (columnMeta.answerType === AnswerType.MultiSelect) {
      return Missing.NoOrUnobtainable;
    }

    return Missing.Unobtainable;
  }

  private async wereConditionsMet(
    row: AnswerExportDbRow,
    conditions: ColumnMetaConditions
  ): Promise<ConditionCheckResult> {
    // No condition means an answer value could be available
    let result: ConditionCheckResult = {
      wasConditionMet: true,
      showErrorForOriginRelationNotFound: false,
    };

    // We first check for conditions on our question because they have
    // higher precedence when evaluating to FALSE
    if (conditions.question) {
      result = await this.wasConditionMet(row, conditions.question);
    }

    if (result.showErrorForOriginRelationNotFound) {
      return result;
    }
    // If a condition on a question was not given or evaluated to TRUE (result.wasConditionMet = true),
    // we need to check if any condition on our answer option is FALSE.
    // Else we can skip checking the answerOption as a FALSE question condition should
    // overrule it.
    if (result.wasConditionMet && conditions.answerOption) {
      const resultForAnswerOption = await this.wasConditionMet(
        row,
        conditions.answerOption
      );

      return resultForAnswerOption;
    }

    return result;
  }

  private async wasConditionMet(
    row: AnswerExportDbRow,
    condition: DbCondition | null
  ): Promise<ConditionCheckResult> {
    if (!condition?.condition_target_answer_option) {
      return condictionNotMetForValidReasons();
    }

    const conditionKey = JSON.stringify(condition);
    const cacheKey = `${row.instance_id}_${row.participant}_${conditionKey}}`;
    const cache = this.conditionCache.get(cacheKey);

    if (cache !== undefined) {
      return cache;
    }

    let result: ConditionCheckResult = {
      wasConditionMet: false,
      showErrorForOriginRelationNotFound: false,
    };

    if (condition.condition_type === ConditionType.INTERNAL_THIS) {
      result = {
        wasConditionMet: await this.wasInternalConditionMet(row, condition),
        showErrorForOriginRelationNotFound: false,
      };
    } else if (condition.condition_type === ConditionType.EXTERNAL) {
      result = await this.wasExternalConditionMet(row, condition);
    }

    this.conditionCache.set(cacheKey, result);

    const conditionCacheEntriesLogThreshold = 100000;
    if (
      this.conditionCache.size > 0 &&
      this.conditionCache.size % conditionCacheEntriesLogThreshold === 0
    ) {
      console.log(
        `AnswersTransform: conditionCache containes ${this.conditionCache.size} entries`
      );
    }

    return result;
  }

  private getColumnMeta(answerOptionId: number): ColumnMeta | undefined {
    return this.metaInfo.columns.find(
      (col) => col.answerOptionId === answerOptionId
    );
  }

  private getAnswer(
    row: AnswerExportDbRow,
    answerOptionId: number
  ): AnswerExportAnswer | null {
    return (
      row.answers.find((a) => a.answer_option_id === answerOptionId) ?? null
    );
  }

  private async getAnswerAndRespectConditions(
    row: AnswerExportDbRow,
    answerOptionId: number
  ): Promise<AnswerExportAnswer | null> {
    const answer = this.getAnswer(row, answerOptionId);

    if (!answer) {
      return null;
    }

    const columnMeta = this.getColumnMeta(answerOptionId);

    // can the answer value be fetched or is not available due to a condition
    let answerNotAvailableDueToCondition = false;
    if (columnMeta && this.hasCondition(columnMeta)) {
      const wereConditionsMet = await this.wereConditionsMet(
        row,
        columnMeta.conditions
      );

      if (
        !wereConditionsMet.showErrorForOriginRelationNotFound &&
        !wereConditionsMet.wasConditionMet
      ) {
        answerNotAvailableDueToCondition = true;
      }
    }
    if (answerNotAvailableDueToCondition) {
      return null;
    }

    return answer;
  }

  private getAnswerVersion(instance: QuestionnaireInstance): number | null {
    switch (instance.status) {
      case 'released':
        return instance.releaseVersion;
      case 'released_once':
        return 1;
      case 'released_twice':
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return 2;
      default:
        return null;
    }
  }

  private async createColumns(
    valueCallback: (
      columnMeta: ColumnMeta
    ) => (string | null) | Promise<string | null>
  ): Promise<Record<string, string | null>> {
    const columns: Record<string, string | null> = {};

    for (const columnMeta of this.metaInfo.columns) {
      columns[columnMeta.name] = await valueCallback(columnMeta);
    }

    return columns;
  }

  private async wasInternalConditionMet(
    row: AnswerExportDbRow,
    condition: DbCondition
  ): Promise<boolean> {
    if (!condition.condition_target_answer_option) {
      return false;
    }

    const answer = await this.getAnswerAndRespectConditions(
      row,
      condition.condition_target_answer_option
    );

    if (!answer) {
      return false;
    }

    const answerType = this.getColumnMeta(answer.answer_option_id)?.answerType;

    if (!answerType) {
      return false;
    }

    return ConditionChecker.isConditionMet(
      { value: answer.value ?? '' },
      condition,
      answerType
    );
  }

  private async wasExternalConditionMet(
    row: AnswerExportDbRow,
    condition: DbCondition
  ): Promise<ConditionCheckResult> {
    if (!condition.condition_target_answer_option) {
      return condictionNotMetForValidReasons();
    }

    const originRelation = await dataSource
      .getRepository(QuestionnaireInstanceOrigin)
      .findOne({
        where: { createdInstance: { id: row.instance_id } },
        relations: { originInstance: true },
      });

    let showErrorForOriginRelationNotFound = true;
    let targetInstance: QuestionnaireInstance | null;

    if (originRelation) {
      showErrorForOriginRelationNotFound = false;

      targetInstance = originRelation.originInstance;
    } else {
      assert(
        condition.condition_target_questionnaire,
        'condition_target_questionnaire is not set but required'
      );
      targetInstance = await dataSource
        .getRepository(QuestionnaireInstance)
        .findOne({
          where: {
            questionnaire: {
              id: condition.condition_target_questionnaire,
              version: condition.condition_target_questionnaire_version,
            },
            pseudonym: row.participant,
            status: In(['released_twice', 'released_once', 'released']),
          },
          relations: { questionnaire: true },
          order: {
            cycle: 'DESC',
          },
        });

      // non-cyclic target questionnaires do not necessarily need the QuestionnaireInstanceOrigin relation to resolve the origin
      if (
        targetInstance?.questionnaire?.cycleUnit === 'once' ||
        targetInstance?.questionnaire?.cycleUnit === 'date'
      ) {
        showErrorForOriginRelationNotFound = false;
      }
    }

    if (!targetInstance) {
      return condictionNotMetForValidReasons();
    }

    const answerOption = await dataSource
      .getRepository(AnswerOption)
      .findOne({ where: { id: condition.condition_target_answer_option } });

    if (!answerOption) {
      return condictionNotMetForValidReasons();
    }

    const versioning = this.getAnswerVersion(targetInstance);
    const answer = await dataSource.getRepository(Answer).findOne({
      where: {
        questionnaireInstanceId: targetInstance.id,
        answerOptionId: answerOption.id,
        versioning: versioning ?? IsNull(),
      },
    });

    if (!answer) {
      return condictionNotMetForValidReasons();
    }

    if (showErrorForOriginRelationNotFound) {
      return { showErrorForOriginRelationNotFound: true };
    }

    const wasConditionMet = ConditionChecker.isConditionMet(
      answer,
      condition,
      answerOption.answerTypeId
    );

    return {
      wasConditionMet,
      showErrorForOriginRelationNotFound: false,
    };
  }
}

type ConditionCheckResult =
  | {
      wasConditionMet: boolean;
      showErrorForOriginRelationNotFound: false;
    }
  | {
      showErrorForOriginRelationNotFound: true;
    };
function condictionNotMetForValidReasons(): ConditionCheckResult {
  return {
    wasConditionMet: false,
    showErrorForOriginRelationNotFound: false,
  };
}
