/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transform, TransformCallback } from 'stream';
import { AnswerData, AnswerDataDto } from '../../models/answer';
import * as os from 'os';

/**
 * Transforms AnswerData to AnswerDataDto
 */
export class AnswerDataTransform extends Transform {
  public constructor() {
    super({ writableObjectMode: true, readableObjectMode: false });
  }

  public _transform(
    chunk: AnswerData,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    const answerDataDto: AnswerDataDto = {
      questionnaireId: chunk.questionnaire_id,
      questionnaireInstanceId: chunk.questionnaire_instance_id,
      questionnaireInstanceDateOfIssue:
        chunk.questionnaire_instance_date_of_issue.toISOString(),
      answerOptionId: chunk.answer_option_id,
      answerOptionVariableName: chunk.answer_option_variable_name,
      values: chunk.values,
    };
    this.push(this.answerDataToStringWithLineSeparator(answerDataDto));
    callback();
  }

  private answerDataToStringWithLineSeparator(data: AnswerDataDto): string {
    return JSON.stringify(data) + os.EOL;
  }
}
