/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Question } from './question';
import { QuestionnaireInstance } from './questionnaireInstance';
import { AnswerOption } from './answerOption';
import { AnswerDto } from '../models/answer';

@Entity()
export class Answer implements AnswerDto {
  @ManyToOne(
    () => QuestionnaireInstance,
    (questionnaireInstance) => questionnaireInstance.answers,
    { primary: true }
  )
  @JoinColumn({ name: 'questionnaire_instance_id', referencedColumnName: 'id' })
  public questionnaireInstance?: QuestionnaireInstance;

  @ManyToOne(() => Question, { primary: true })
  @JoinColumn({ name: 'question_id', referencedColumnName: 'id' })
  public question?: Question;

  @ManyToOne(() => AnswerOption, { primary: true })
  @JoinColumn({ name: 'answer_option_id', referencedColumnName: 'id' })
  public answerOption?: AnswerOption;

  @PrimaryColumn()
  public versioning!: number;

  @Column()
  public value!: string;

  @Column({ type: 'timestamp', nullable: true })
  public dateOfRelease!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  public releasingPerson!: string | null;
}

export type PartialAnswer = Pick<Answer, 'answerOption' | 'question' | 'value'>;
