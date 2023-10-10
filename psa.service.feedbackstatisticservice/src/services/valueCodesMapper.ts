/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionInternalDto } from '@pia-system/lib-http-clients-internal';

export type AnswerOptionId = number;
export type VariableName = string;
export type Value = string;
export type Code = number;

export class ValueCodesMapper {
  private static readonly FALLBACK_VARIABLE_NAME_PREFIX = ':::FVNP:::';
  private readonly valueCodes: Map<VariableName, Map<Value, Code>> = new Map();

  public constructor(private readonly questions: QuestionInternalDto[]) {
    this.initValueCodes();
  }

  public map(
    variableName: VariableName | null,
    answerOptionId: AnswerOptionId,
    values: Value[]
  ): Code[] | null {
    const answerOptionValueCodes = this.valueCodes.get(
      variableName ?? this.getFallbackVariableName(answerOptionId)
    );
    if (!answerOptionValueCodes) {
      console.info(
        `Cannot map answer option ${answerOptionId} because it does not exist on configured questionnaire`
      );
      return null;
    }

    return values.flatMap((value) => {
      const code = answerOptionValueCodes.get(value);
      if (code === undefined) {
        if (value === '') {
          return [];
        }

        throw new Error(`Missing code for value ${value}`);
      }

      return [code];
    });
  }

  private getFallbackVariableName(
    answerOptionId: AnswerOptionId
  ): VariableName {
    return (
      ValueCodesMapper.FALLBACK_VARIABLE_NAME_PREFIX + answerOptionId.toString()
    );
  }

  private initValueCodes(): void {
    this.questions.forEach((question) => {
      question.answerOptions?.forEach((answerOption) => {
        const answerOptionValueCodes = new Map<Value, Code>(
          answerOption.values?.map((value, index) => {
            // eslint-disable-next-line security/detect-object-injection
            const code = answerOption.valuesCode?.[index];
            if (code === undefined) {
              throw new Error(
                `Missing code for value ${value} of answer option ${answerOption.id}`
              );
            }
            return [value, code];
          })
        );
        this.valueCodes.set(
          answerOption.variableName ??
            this.getFallbackVariableName(answerOption.id),
          answerOptionValueCodes
        );
      });
    });
  }
}
