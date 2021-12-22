/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ConditionDto,
  ConditionLink,
  ConditionOperand,
  ConditionType,
} from '../models/condition';
import { AnswerOption } from './answerOption';
import { Questionnaire } from './questionnaire';
import { Question } from './question';

@Entity()
export class Condition implements ConditionDto {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ name: 'condition_type', type: 'varchar' })
  public type!: ConditionType | null;

  @Column({ name: 'condition_value', type: 'varchar' })
  public value!: string | null;

  @Column({ name: 'condition_link', type: 'varchar' })
  public link!: ConditionLink | null;

  @Column({ name: 'condition_operand', type: 'varchar' })
  public operand!: ConditionOperand | null;

  @ManyToOne(() => AnswerOption)
  @JoinColumn({
    name: 'condition_target_answer_option',
    referencedColumnName: 'id',
  })
  public targetAnswerOption?: AnswerOption | null;

  @ManyToOne(() => Questionnaire)
  @JoinColumn([
    { name: 'condition_target_questionnaire', referencedColumnName: 'id' },
    {
      name: 'condition_target_questionnaire_version',
      referencedColumnName: 'version',
    },
  ])
  public targetQuestionnaire?: Questionnaire | null;

  @OneToOne(() => AnswerOption, (answerOption) => answerOption.condition)
  @JoinColumn({
    name: 'condition_answer_option_id',
    referencedColumnName: 'id',
  })
  public conditionAnswerOption?: AnswerOption | null;

  @OneToOne(() => Question, (question) => question.condition)
  @JoinColumn({
    name: 'condition_question_id',
    referencedColumnName: 'id',
  })
  public conditionQuestion?: Question | null;

  @OneToOne(() => Questionnaire, (questionnaire) => questionnaire.condition)
  @JoinColumn([
    { name: 'condition_questionnaire_id', referencedColumnName: 'id' },
    {
      name: 'condition_questionnaire_version',
      referencedColumnName: 'version',
    },
  ])
  public conditionQuestionnaire?: Questionnaire | null;
}
