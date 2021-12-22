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
  PrimaryColumn,
} from 'typeorm';
import { AnswerOptionDto, AnswerType } from '../models/answerOption';
import { Question } from './question';
import { Condition } from './condition';

@Entity()
export class AnswerOption implements AnswerOptionDto {
  @PrimaryColumn()
  public id!: number;

  @Column()
  public position!: number;

  @Column({ type: 'varchar', nullable: true })
  public text!: string | null;

  @Column({ type: 'varchar' })
  public answerTypeId!: AnswerType;

  @Column({ type: 'boolean', nullable: true })
  public isConditionTarget!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  public isDecimal!: boolean | null;

  @Column({ type: 'boolean', array: true, nullable: true })
  public isNotable!: boolean[] | null;

  @Column({ type: 'varchar', nullable: true })
  public label!: string | null;

  @Column({ type: 'integer', nullable: true })
  public restrictionMax!: number | null;

  @Column({ type: 'integer', nullable: true })
  public restrictionMin!: number | null;

  @Column({ type: 'varchar', array: true, nullable: true })
  public values!: string[] | null;

  @Column({ type: 'integer', array: true, nullable: true })
  public valuesCode!: number[] | null;

  @ManyToOne(() => Question, (question) => question.answerOptions)
  @JoinColumn({ name: 'question_id', referencedColumnName: 'id' })
  public question?: Question;

  @OneToOne(() => Condition, (condition) => condition.conditionAnswerOption, {
    cascade: true,
  })
  public condition?: Condition | null;
}
