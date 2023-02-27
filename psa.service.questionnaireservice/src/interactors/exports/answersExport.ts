/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import {
  ColumnNameAnswerValue,
  DateFormat,
  ExportUtilities,
} from '../../services/exportUtilities';
import { getRepository } from 'typeorm';
import { Questionnaire } from '../../entities/questionnaire';
import { QuestionnaireMetaInfoRow } from '../../models/export/questionnaireMetaInfoRow';
import { AnswersTransform } from '../../services/csvTransformStreams/answersTransform';
import { CsvService } from '../../services/csvService';
import { QuestionnaireInstance } from '../../entities/questionnaireInstance';
import { AnswerType } from '../../models/answerOption';
import { UserFile } from '../../entities/userFile';
import { ReadStream } from 'fs';
import { ExportMetaInfo } from '../../models/export/exportMetaInfo';
import { ColumnMeta } from '../../models/export/columnMeta';
import { ColumnMetaInfo } from '../../models/export/columnMetaInfo';
import { QuestionnaireInfo } from '../../models/questionnaireInfo';

const SAMPLE_COLUMNS_COUNT = 2;
const BASE64_ENCODING_MARK = ';base64,';

export class AnswersExport extends AbstractExportFeature {
  public async apply(): Promise<void[]> {
    const filePromises: Promise<void>[] = [];
    const questionnaires = await this.getQuestionnaires();

    for (const questionnaire of questionnaires) {
      const metaInfo = await this.getQuestionnaireMetaInfo(questionnaire);
      const answersStream = await this.getAnswersStream(questionnaire);

      const transformStream = new AnswersTransform(metaInfo);
      const csvStream = CsvService.stringify();

      const questionnaireName = ExportUtilities.sanitizeForFilename(
        questionnaire.name
      );
      const date = ExportUtilities.formatDate(
        new Date(),
        DateFormat.InFilename
      );
      this.archive.append(answersStream.pipe(transformStream).pipe(csvStream), {
        name: `answers/answers_${questionnaireName}_v${questionnaire.version}_${questionnaire.id}_${date}.csv`,
      });

      filePromises.push(this.attachFilesToZip(transformStream));
    }

    return Promise.all(filePromises);
  }

  private async getQuestionnaires(): Promise<QuestionnaireInfo[]> {
    let questionnaireWhere = '';

    if (this.options.questionnaires) {
      questionnaireWhere = this.options.questionnaires
        .map((q) => `(${+q.id},${+q.version})`)
        .join(',');
      questionnaireWhere = `AND (q.id, q.version) IN (${questionnaireWhere})`;
    }

    return (await getRepository(Questionnaire)
      .createQueryBuilder('q')
      .select(['q.id id', 'q.name "name"', 'q.version "version"'])
      .where(
        `q.study_id = :studyId AND
                qi.id IS NOT NULL
                ${questionnaireWhere}`,
        {
          studyId: this.options.study_name,
        }
      )
      .leftJoin(
        'questionnaire_instances',
        'qi',
        `
        qi.questionnaire_id = q.id AND 
        qi.questionnaire_version = q.version AND
        qi.user_id IN (:...probands)
      `,
        {
          probands: this.probandPseudonyms,
        }
      )
      .groupBy('q.id, q.version')
      .addOrderBy('version', 'ASC')
      .execute()) as QuestionnaireInfo[];
  }

  private async attachFilesToZip(
    transformStream: AnswersTransform
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      transformStream.on('end', () => {
        if (transformStream.fileIds.size === 0) {
          resolve();
          return;
        }

        const ids = Array.from(transformStream.fileIds.values());

        getRepository(UserFile)
          .createQueryBuilder()
          .select(['id', 'file_name', 'file'])
          .where('id IN (:...ids)', { ids })
          .stream()
          .then((userFiles) => {
            this.writeUserFilesToArchive(userFiles);
            userFiles.on('end', () => resolve());
          })
          .catch(() => {
            reject();
          });
      });
    });
  }

  private writeUserFilesToArchive(userFiles: ReadStream): void {
    userFiles.on(
      'data',
      (file: { id: number; file_name: string | null; file: string }) => {
        const base64EncodingMarkIndex = file.file.indexOf(BASE64_ENCODING_MARK);
        if (base64EncodingMarkIndex !== -1) {
          const fileData = Buffer.from(
            file.file.substring(
              base64EncodingMarkIndex + BASE64_ENCODING_MARK.length
            ),
            'base64'
          );
          const filename = ExportUtilities.composeFileName(
            file.id,
            file.file_name
          );

          this.archive.append(fileData, {
            name: `files/${filename}`,
          });
        }
      }
    );
  }

  private async getAnswersStream(
    questionnaire: QuestionnaireInfo
  ): Promise<ReadStream> {
    return await getRepository(QuestionnaireInstance)
      .createQueryBuilder('qi')
      .select([
        'qi.id instance_id',
        'qi.user_id participant',
        'proband.is_test_proband is_test_participant',
        'qi.cycle "cycle"',
        'qi.date_of_issue date_of_issue',
        'COALESCE(qi.date_of_release_v2, qi.date_of_release_v1) answer_date',
        'qi.status answer_status',
        `json_agg(
            json_build_object(
              'question_id', answer.question_id, 
              'answer_option_id', answer.answer_option_id,
              'value', answer.value,
              'file_name', file.file_name,
              'file_id', file.id
            )
            ORDER BY question.position ASC, answer_option.position ASC
          ) answers`,
      ])
      .where(
        `
          qi.questionnaire_id IN (:id) AND 
          qi.questionnaire_version IN (:version) AND
          qi.date_of_issue >= :startDate AND
          qi.date_of_issue <= :endDate AND
          qi.user_id IN (:...probands) AND
          qi.status != 'inactive'
        `,
        {
          id: questionnaire.id,
          version: questionnaire.version,
          startDate: this.startDate,
          endDate: this.endDate,
          probands: this.probandPseudonyms,
        }
      )
      .leftJoin(
        'answers',
        'answer',
        `
      answer.questionnaire_instance_id = qi.id AND  
      answer.versioning = qi.release_version AND 
      qi.status IN ('released_twice','released_once', 'released')
      `
      )
      .leftJoin(
        'answer_options',
        'answer_option',
        'answer_option.id = answer.answer_option_id'
      )
      .leftJoin('questions', 'question', 'question.id = answer.question_id')
      .leftJoin('user_files', 'file', 'answer.value = file.id::text')
      .leftJoin('probands', 'proband', 'proband.pseudonym = qi.user_id')
      .groupBy('qi.id, proband.pseudonym')
      .addOrderBy('qi.cycle', 'ASC')
      .addOrderBy('qi.user_id', 'ASC')
      .stream();
  }

  private async getQuestionnaireMetaInfo(
    questionnaire: QuestionnaireInfo
  ): Promise<ExportMetaInfo> {
    const metaInfoResult: QuestionnaireMetaInfoRow[] = (await getRepository(
      Questionnaire
    )
      .createQueryBuilder('questionnaire')
      .select([
        'questionnaire.id questionnaire_id',
        'questionnaire.version questionnaire_version',
        'questionnaire.name questionnaire_name',
        'json_agg(questionnaire_condition.*) questionnaire_condition',

        'question.id question_id',
        'question.variable_name question_variable_name',
        'question.position question_position',
        'question.is_mandatory question_is_mandatory',
        'json_agg(question_condition.*) question_condition',

        'answerOption.id answerOption_id',
        'answerOption.text answerOption_text',
        'answerOption.answer_type_id answerOption_type_id',
        'answerOption.position answerOption_position',
        'answerOption.values answerOption_values',
        'answerOption.values_code answerOption_value_code',
        'answerOption.variable_name answerOption_variable_name',
        'json_agg(answeroption_condition.*) answeroption_condition',
      ])
      .where(
        `
          questionnaire.id = :id AND
          questionnaire.version = :version
          `,
        { id: questionnaire.id, version: questionnaire.version }
      )
      .leftJoin('questionnaire.questions', 'question')
      .leftJoin('questionnaire.condition', 'questionnaire_condition')
      .leftJoin('question.condition', 'question_condition')
      .leftJoin('question.answerOptions', 'answerOption')
      .leftJoin('answerOption.condition', 'answeroption_condition')
      .addOrderBy('questionnaire.name', 'ASC')
      .addOrderBy('questionnaire.version', 'ASC')
      .addOrderBy('question.position', 'ASC')
      .addOrderBy('answerOption.position', 'ASC')
      .groupBy(
        'questionnaire.id, question.id, answerOption.id, questionnaire.version, question.position, questionnaire.name, answerOption.position'
      )
      .execute()) as QuestionnaireMetaInfoRow[];

    const metaInfo: ExportMetaInfo = {
      id: questionnaire.id,
      version: questionnaire.version,
      name: questionnaire.name,
      condition: metaInfoResult[0]?.questionnaire_condition[0] ?? null,
      questions: new Map(),
      columns: [],
    };

    metaInfoResult.forEach((row) => {
      if (!metaInfo.questions.has(row.question_id)) {
        metaInfo.questions.set(row.question_id, {
          condition: row.question_condition[0],
          isMandatory: row.question_is_mandatory,
          position: row.question_position,
          variableName: row.question_variable_name,
        });
      }

      const columnsMeta = this.createColumnsMetaDataForRow(
        row,
        this.createCommonColumnNameParams(row),
        this.createCommonColumnMetaInfo(row)
      );

      metaInfo.columns = [...metaInfo.columns, ...columnsMeta];
    });

    return metaInfo;
  }

  private createCommonColumnMetaInfo(
    row: QuestionnaireMetaInfoRow
  ): ColumnMetaInfo {
    return {
      name: '',
      conditions: {
        answerOption: row.answeroption_condition[0] ?? null,
        question: row.question_condition[0] ?? null,
      },
      isMandatory: row.question_is_mandatory,
      position: row.answeroption_position,
      text: row.answeroption_text,
      variableName: row.question_variable_name,
      answerType: row.answeroption_type_id,
      answerOptionId: row.answeroption_id,
    };
  }

  private createCommonColumnNameParams(
    row: QuestionnaireMetaInfoRow
  ): ColumnNameAnswerValue {
    return {
      questionVariableName: row.question_variable_name,
      questionPosition: row.question_position,
      questionnaireName: row.questionnaire_name,
      questionnaireId: row.questionnaire_id,
      questionnaireVersion: row.questionnaire_version,
      answerOptionVariableName: row.answeroption_variable_name,
      answerOptionPosition: row.answeroption_position,
      answerType: row.answeroption_type_id,
    };
  }

  private createColumnsMetaDataForRow(
    row: QuestionnaireMetaInfoRow,
    rowColumnNameParams: ColumnNameAnswerValue,
    rowColumnMetaInfo: ColumnMetaInfo
  ): ColumnMeta[] {
    const columnsMeta: ColumnMeta[] = [];
    switch (row.answeroption_type_id) {
      case AnswerType.SingleSelect:
        this.createMetaDataSingleSelect(
          rowColumnNameParams,
          columnsMeta,
          rowColumnMetaInfo,
          row
        );
        break;
      case AnswerType.MultiSelect:
        this.createMetaDataMultiSelect(
          rowColumnNameParams,
          columnsMeta,
          rowColumnMetaInfo,
          row
        );
        break;
      case AnswerType.Sample:
        this.createColumnMetaDataSample(
          rowColumnNameParams,
          columnsMeta,
          rowColumnMetaInfo,
          row
        );
        break;
      case null:
        // an answer_type_id of null means, it is a question and not an answer_option
        break;
      default:
        this.createColumnMetaData(
          rowColumnNameParams,
          columnsMeta,
          rowColumnMetaInfo
        );
    }
    return columnsMeta;
  }

  private createColumnMetaData(
    rowColumnNameParams: ColumnNameAnswerValue,
    columnsMeta: ColumnMeta[],
    rowColumnMetaInfo: ColumnMetaInfo
  ): void {
    const columnName =
      ExportUtilities.composeColumnNameAnswerOption(rowColumnNameParams);
    columnsMeta.push({ ...rowColumnMetaInfo, name: columnName });
  }

  private createColumnMetaDataSample(
    rowColumnNameParams: ColumnNameAnswerValue,
    columnsMeta: ColumnMeta[],
    rowColumnMetaInfo: ColumnMetaInfo,
    row: QuestionnaireMetaInfoRow
  ): void {
    for (let pos = 1; pos <= SAMPLE_COLUMNS_COUNT; pos++) {
      const columnName = ExportUtilities.composeColumnNameAnswerValue({
        ...rowColumnNameParams,
        answerValueSampleId: pos,
      });
      columnsMeta.push({
        ...rowColumnMetaInfo,
        answerType: row.answeroption_type_id,
        name: columnName,
        sampleId: pos,
      });
    }
  }

  private createMetaDataMultiSelect(
    rowColumnNameParams: ColumnNameAnswerValue,
    columnsMeta: ColumnMeta[],
    rowColumnMetaInfo: ColumnMetaInfo,
    row: QuestionnaireMetaInfoRow
  ): void {
    row.answeroption_values.forEach((value, index) => {
      const columnName = ExportUtilities.composeColumnNameAnswerValue({
        ...rowColumnNameParams,
        answerValuePosition: index + 1,
        answerValueText: value,
      });
      columnsMeta.push({
        ...rowColumnMetaInfo,
        answerType: row.answeroption_type_id,
        name: columnName,
        value,
        // eslint-disable-next-line security/detect-object-injection
        code: row.answeroption_value_code[index] ?? null,
      });
    });
  }

  private createMetaDataSingleSelect(
    rowColumnNameParams: ColumnNameAnswerValue,
    columnsMeta: ColumnMeta[],
    rowColumnMetaInfo: ColumnMetaInfo,
    row: QuestionnaireMetaInfoRow
  ): void {
    const columnName =
      ExportUtilities.composeColumnNameAnswerOption(rowColumnNameParams);
    columnsMeta.push({
      ...rowColumnMetaInfo,
      name: columnName,
      answerType: row.answeroption_type_id,
      values: row.answeroption_values,
      codes: row.answeroption_value_code,
    });
  }
}
