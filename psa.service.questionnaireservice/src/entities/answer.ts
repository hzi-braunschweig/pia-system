/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

import { Question } from './question';
import { QuestionnaireInstance } from './questionnaireInstance';
import { AnswerOption } from './answerOption';
import { AnswerDto } from '../models/answer';

@Entity()
export class Answer implements AnswerDto {
  @PrimaryColumn()
  public questionnaireInstanceId?: number;

  @ManyToOne(
    () => QuestionnaireInstance,
    (questionnaireInstance) => questionnaireInstance.answers
  )
  public questionnaireInstance?: QuestionnaireInstance;

  @PrimaryColumn()
  public questionId?: number;

  @ManyToOne(() => Question)
  public question?: Question;

  @PrimaryColumn()
  public answerOptionId?: number;

  @ManyToOne(() => AnswerOption)
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
