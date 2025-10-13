/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RandomDigitsGenerator } from '@pia/lib-service-core';
import { CouldNotCreateNewRandomVariableNameError } from '../errors';

const MAX_TRIES = 100;

export function variableNameGenerator(
  length: number,
  unavailableNames: string[] = []
): string {
  let variableName = '';

  for (let countTries = 0; countTries < MAX_TRIES; countTries++) {
    variableName = `auto-${RandomDigitsGenerator.generate(length)}`;

    if (!unavailableNames.includes(variableName)) {
      return variableName;
    }
  }

  throw new CouldNotCreateNewRandomVariableNameError(
    `it seems that all possible variable names have been assigned (tried it ${MAX_TRIES} times)`
  );
}

const GENERATED_VARIABLE_DIGITS_LENGTH = 8;

/**
 * Adds variable names when not set by mutating questions and answer options
 * of the given questionnaire
 */
export default function generateAndSetVariableNames<
  T extends {
    questions?: {
      variable_name?: string | null;
      answer_options?: { variable_name?: string | null }[];
    }[];
  }
>(
  questionnaire: T
): asserts questionnaire is T & {
  questions: {
    variable_name: string;
    answer_options: { variable_name: string }[];
  }[];
} {
  const unavailableNames: string[] = [];

  questionnaire.questions?.forEach((question) => {
    if (!question.variable_name) {
      question.variable_name = variableNameGenerator(
        GENERATED_VARIABLE_DIGITS_LENGTH,
        unavailableNames
      );
      unavailableNames.push(question.variable_name);
    }

    question.answer_options
      ?.filter((ao) => !ao.variable_name)
      .forEach((answerOption) => {
        answerOption.variable_name = variableNameGenerator(
          GENERATED_VARIABLE_DIGITS_LENGTH,
          unavailableNames
        );
        unavailableNames.push(answerOption.variable_name);
      });
    return question;
  });
}
