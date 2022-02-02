/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Question } from '../models/question';
import { AnswerOption } from '../models/answerOption';
import { ConditionType } from '../models/condition';

enum CanBeAdded {
  YES = 1,
  NO = 2,
  PENDING = 3,
}

interface QuestionAnswerOptionPair {
  question: Question;
  answerOption: AnswerOption;
}

export class QuestionCleanerDeprecated {
  private readonly questionsAndStatus: Map<number, CanBeAdded> = new Map<
    number,
    CanBeAdded
  >();
  private readonly answerOptionsAndStatus: Map<number, CanBeAdded> = new Map<
    number,
    CanBeAdded
  >();
  private readonly questionAnswerOptionPairs: QuestionAnswerOptionPair[];

  public constructor(private readonly questions: Question[]) {
    this.questionAnswerOptionPairs = questions.flatMap((question) =>
      question.answer_options.map((answerOption) => ({
        question,
        answerOption,
      }))
    );
  }

  public getQuestionsToAdd(): Question[] {
    return this.questions
      .filter(
        (question) => this.canQuestionBeAdded(question) === CanBeAdded.YES
      )
      .filter((question) => {
        if (question.answer_options.length === 0) return true;
        question.answer_options = question.answer_options.filter(
          (answerOption) =>
            this.canAnswerOptionBeAdded(answerOption) === CanBeAdded.YES
        );
        return question.answer_options.length > 0;
      });
  }

  private canQuestionBeAdded(question: Question): CanBeAdded {
    if (this.questionsAndStatus.has(question.id)) {
      return this.questionsAndStatus.get(question.id)!;
    }

    if (
      !question.condition ||
      question.condition.condition_type !== ConditionType.INTERNAL_THIS
    ) {
      this.questionsAndStatus.set(question.id, CanBeAdded.YES);
      return CanBeAdded.YES;
    }

    const targetAnswerOption =
      question.condition.condition_target_answer_option;
    const conditionTarget = this.questionAnswerOptionPairs.find(
      (pair) => pair.answerOption.id === targetAnswerOption
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

  private canAnswerOptionBeAdded(answerOption: AnswerOption): CanBeAdded {
    if (this.answerOptionsAndStatus.has(answerOption.id)) {
      return this.answerOptionsAndStatus.get(answerOption.id)!;
    }

    if (
      !answerOption.condition ||
      answerOption.condition.condition_type !== ConditionType.INTERNAL_THIS
    ) {
      this.answerOptionsAndStatus.set(answerOption.id, CanBeAdded.YES);
      return CanBeAdded.YES;
    }

    const targetAnswerOption =
      answerOption.condition.condition_target_answer_option;
    const conditionTarget = this.questionAnswerOptionPairs.find(
      (pair) => pair.answerOption.id === targetAnswerOption
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
