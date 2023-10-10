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
import { getRepository } from 'typeorm';
import { Answer } from '../../entities/answer';
import { AnswerOption } from '../../entities/answerOption';
import { QuestionnaireInstance } from '../../entities/questionnaireInstance';
import { DbQuestionnaireInstance } from '../../models/questionnaireInstance';
import { SingleSelectMetaInfo } from '../../models/export/singleSelectMetaInfo';
import { MultiSelectMetaInfo } from '../../models/export/multiSelectMetaInfo';
import { SampleIdMetaInfo } from '../../models/export/sampleIdMetaInfo';
import { ColumnMetaInfo } from '../../models/export/columnMetaInfo';
import { ColumnMetaConditions } from '../../models/export/sharedColumnMetaInfo';

export class AnswersTransform extends CsvTransform<
  AnswerExportDbRow,
  CsvAnswerRow
> {
  public readonly conditionCache = new Map<string, boolean>();
  public readonly fileIds = new Set<number>();
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

    const rowConditionWasUnmet =
      this.hasCondition(this.metaInfo) &&
      !(await this.wasConditionMet(row, this.metaInfo.condition));

    if (rowConditionWasUnmet) {
      return this.createColumns(() => Missing.NotApplicable);
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
    row: AnswerExportDbRow
  ): Promise<string | null> {
    if (
      this.hasCondition(columnMeta) &&
      !(await this.wereConditionsMet(row, columnMeta.conditions))
    ) {
      return Missing.NotApplicable;
    }

    const answer = this.getAnswer(row, columnMeta.answerOptionId);

    return (
      this.transformValueFromAnswer(columnMeta, answer) ??
      (await this.determineMissing(row, columnMeta))
    );
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
    if (
      this.hasCondition(columnMeta) &&
      !(await this.wereConditionsMet(row, columnMeta.conditions))
    ) {
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
  ): Promise<boolean> {
    // No condition means an answer value could be available
    let result = true;

    // We first check for conditions on our question because they have
    // higher precedence when evaluating to FALSE
    if (conditions.question) {
      result = await this.wasConditionMet(row, conditions.question);
    }

    // If a condition on a question was not given or evaluated to TRUE (result = true),
    // we need to check if any condition on our answer option is FALSE.
    // Else we can skip checking the answerOption as a FALSE question condition should
    // overrule it.
    if (result && conditions.answerOption) {
      result = await this.wasConditionMet(row, conditions.answerOption);
    }

    return result;
  }

  private async wasConditionMet(
    row: AnswerExportDbRow,
    condition: DbCondition | null
  ): Promise<boolean> {
    if (!condition?.condition_target_answer_option) {
      return false;
    }

    const conditionKey = JSON.stringify(condition);
    const cacheKey = `${row.instance_id}_${row.participant}_${conditionKey}}`;
    const cache = this.conditionCache.get(cacheKey);

    if (cache !== undefined) {
      return cache;
    }

    let result = false;

    if (condition.condition_type === ConditionType.INTERNAL_THIS) {
      result = await this.wasInternalConditionMet(row, condition);
    } else if (condition.condition_type === ConditionType.EXTERNAL) {
      result = await this.wasExternalConditionMet(row, condition);
    }

    this.conditionCache.set(cacheKey, result);

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
    if (
      columnMeta &&
      this.hasCondition(columnMeta) &&
      !(await this.wereConditionsMet(row, columnMeta.conditions))
    ) {
      return null;
    }

    return answer;
  }

  private getAnswerVersion(
    instance: Pick<DbQuestionnaireInstance, 'id' | 'status' | 'release_version'>
  ): number | null {
    switch (instance.status) {
      case 'released':
        return instance.release_version;
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
  ): Promise<boolean> {
    if (!condition.condition_target_answer_option) {
      return false;
    }

    const targetInstance = await getRepository(QuestionnaireInstance)
      .createQueryBuilder('qi')
      .select(['id', 'status', 'release_version'])
      .where(
        `
        questionnaire_id = :questionnaire_id AND 
        questionnaire_version = :questionnaire_version AND
        user_id = :user_id AND
        status IN ('released_twice', 'released_once', 'released')
        `,
        {
          questionnaire_id: condition.condition_target_questionnaire,
          questionnaire_version:
            condition.condition_target_questionnaire_version,
          user_id: row.participant,
        }
      )
      .addOrderBy('cycle', 'DESC')
      .getRawOne<{
        id: number;
        release_version: number;
        status: 'released_twice' | 'released_once' | 'released';
      }>();

    if (!targetInstance) {
      return false;
    }

    const answerOption = await getRepository(AnswerOption).findOne(
      condition.condition_target_answer_option
    );

    if (!answerOption) {
      return false;
    }

    const versioning = this.getAnswerVersion(targetInstance);
    const answer = await getRepository(Answer).findOne({
      where: {
        questionnaireInstance: targetInstance.id,
        answerOption: answerOption.id,
        versioning,
      },
    });

    if (!answer) {
      return false;
    }

    return ConditionChecker.isConditionMet(
      answer,
      condition,
      answerOption.answerTypeId
    );
  }
}
