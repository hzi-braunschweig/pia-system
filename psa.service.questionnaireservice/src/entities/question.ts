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
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Questionnaire } from './questionnaire';
import { AnswerOption } from './answerOption';
import { Condition } from './condition';
import { QuestionDto } from '../models/question';

@Entity()
export class Question implements QuestionDto {
  /**
   * @isInt
   */
  @PrimaryColumn()
  public id!: number;

  @Column({ type: 'boolean', nullable: true })
  public isMandatory!: boolean | null;

  /**
   * @isInt
   */
  @Column()
  public position!: number;

  @Column()
  public text!: string;

  @Column({ type: 'text', nullable: true })
  public helpText!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public variableName!: string | null;

  @ManyToOne(() => Questionnaire, (questionnaire) => questionnaire.questions)
  @JoinColumn([
    { name: 'questionnaire_id', referencedColumnName: 'id' },
    {
      name: 'questionnaire_version',
      referencedColumnName: 'version',
    },
  ])
  public questionnaire?: Questionnaire;

  @OneToMany(() => AnswerOption, (answerOption) => answerOption.question, {
    cascade: true,
  })
  public answerOptions?: AnswerOption[];

  @OneToOne(() => Condition, (condition) => condition.conditionQuestion, {
    cascade: true,
  })
  public condition?: Condition | null;
}
