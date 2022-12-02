/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionDto } from '../models/question';
import { AnswerOptionDto } from '../models/answerOption';
import { ConditionType } from '../models/condition';

enum CanBeAdded {
  YES = 1,
  NO = 2,
  PENDING = 3,
}

interface QuestionAnswerOptionPair {
  question: QuestionDto;
  answerOption: AnswerOptionDto;
}

export class QuestionCleaner {
  private readonly questionsAndStatus: Map<number, CanBeAdded> = new Map<
    number,
    CanBeAdded
  >();
  private readonly answerOptionsAndStatus: Map<number, CanBeAdded> = new Map<
    number,
    CanBeAdded
  >();
  private readonly questionAnswerOptionPairs: (
    | QuestionAnswerOptionPair
    | undefined
  )[];

  public constructor(private readonly questions: QuestionDto[]) {
    this.questionAnswerOptionPairs = questions.flatMap((question) =>
      question.answerOptions?.map((answerOption) => ({
        question,
        answerOption,
      }))
    );
  }

  public getQuestionsToAdd(): QuestionDto[] {
    return this.questions
      .filter(
        (question) => this.canQuestionBeAdded(question) === CanBeAdded.YES
      )
      .filter((question) => {
        if (question.answerOptions?.length === 0) return true;
        question.answerOptions = question.answerOptions?.filter(
          (answerOption) =>
            this.canAnswerOptionBeAdded(answerOption) === CanBeAdded.YES
        );
        return question.answerOptions && question.answerOptions.length > 0;
      });
  }

  private canQuestionBeAdded(question: QuestionDto): CanBeAdded | undefined {
    if (this.questionsAndStatus.has(question.id)) {
      return this.questionsAndStatus.get(question.id);
    }

    if (
      !question.condition ||
      question.condition.type !== ConditionType.INTERNAL_THIS
    ) {
      this.questionsAndStatus.set(question.id, CanBeAdded.YES);
      return CanBeAdded.YES;
    }

    const targetAnswerOption = question.condition.targetAnswerOption;
    const conditionTarget = this.questionAnswerOptionPairs.find(
      (pair) => pair?.answerOption.id === targetAnswerOption?.id
    );
    if (!conditionTarget) {
      this.questionsAndStatus.set(question.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }

    this.questionsAndStatus.set(question.id, CanBeAdded.PENDING);
    const targetQuestionCanBeAdded = this.canQuestionBeAdded(
      conditionTarget.question
    );
    if (targetQuestionCanBeAdded === CanBeAdded.PENDING) {
      console.log(
        'There is a circular reference in this questionnaire. This Question can never be displayed.',
        question.id
      );
      this.questionsAndStatus.set(question.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }
    if (targetQuestionCanBeAdded === CanBeAdded.NO) {
      this.questionsAndStatus.set(question.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }

    const targetAnswerOptionCanBeAdded = this.canAnswerOptionBeAdded(
      conditionTarget.answerOption
    );
    this.questionsAndStatus.set(question.id, targetAnswerOptionCanBeAdded);
    return targetAnswerOptionCanBeAdded;
  }

  private canAnswerOptionBeAdded(answerOption: AnswerOptionDto): CanBeAdded {
    if (this.answerOptionsAndStatus.has(answerOption.id)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.answerOptionsAndStatus.get(answerOption.id)!;
    }

    if (
      !answerOption.condition ||
      answerOption.condition.type !== ConditionType.INTERNAL_THIS
    ) {
      this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.YES);
      return CanBeAdded.YES;
    }

    const targetAnswerOption = answerOption.condition.targetAnswerOption;
    const conditionTarget = this.questionAnswerOptionPairs.find(
      (pair) => pair?.answerOption.id === targetAnswerOption?.id
    );
    if (!conditionTarget) {
      this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }

    this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.PENDING);
    const targetQuestionCanBeAdded = this.canQuestionBeAdded(
      conditionTarget.question
    );
    if (targetQuestionCanBeAdded === CanBeAdded.PENDING) {
      console.log(
        'There is a circular reference in this questionnaire. This AnswerOption can never be displayed.',
        answerOption.id
      );
      this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }
    if (targetQuestionCanBeAdded === CanBeAdded.NO) {
      this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }

    const targetAnswerOptionCanBeAdded = this.canAnswerOptionBeAdded(
      conditionTarget.answerOption
    );
    if (targetAnswerOptionCanBeAdded === CanBeAdded.PENDING) {
      console.log(
        'There is a circular reference in this questionnaire. This AnswerOption can never be displayed.',
        answerOption.id
      );
      this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.NO);
      return CanBeAdded.NO;
    }
    this.answerOptionsAndStatus.set(
      answerOption.id,
      targetAnswerOptionCanBeAdded
    );
    return targetAnswerOptionCanBeAdded;
  }
}
