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
import { AnswerOptionDto, AnswerType } from '../models/answerOption';
import { Condition } from './condition';
import { Question } from './question';

@Entity()
export class AnswerOption implements AnswerOptionDto {
  /**
   * @isInt
   */
  @PrimaryGeneratedColumn('identity') // even though we do not use IDENTITY, the internal custom pg trigger works like this
  public id!: number;

  /**
   * Order position in the question starting with 1
   * @isInt
   */
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
  public variableName!: string | null;

  /**
   * @isInt
   */
  @Column({ type: 'integer', nullable: true })
  public restrictionMax!: number | null;

  /**
   * @isInt
   */
  @Column({ type: 'integer', nullable: true })
  public restrictionMin!: number | null;

  @Column({ type: 'varchar', array: true, nullable: true })
  public values!: string[] | null;

  /**
   * @isInt
   */
  @Column({ type: 'integer', array: true, nullable: true })
  public valuesCode!: number[] | null;

  @ManyToOne(() => Question, (question) => question.answerOptions)
  @JoinColumn({ name: 'question_id', referencedColumnName: 'id' })
  public question?: Question;

  @OneToOne(() => Condition, (condition) => condition.conditionAnswerOption, {
    cascade: true,
  })
  public condition?: Condition | null;

  @Column({ type: 'boolean', nullable: true })
  public useAutocomplete?: boolean | null;
}
