/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CycleUnit,
  QuestionnaireDto,
  QuestionnaireType,
} from '../models/questionnaire';
import { Question } from './question';
import { Condition } from './condition';

@Entity()
export class Questionnaire implements QuestionnaireDto {
  @PrimaryColumn()
  public id!: number;

  @PrimaryColumn()
  public version!: number;

  @Column({ type: 'varchar', nullable: true })
  public studyId!: string | null;

  @Column()
  public name!: string;

  @Column()
  public noQuestions!: number;

  @Column({ type: 'integer', nullable: true })
  public cycleAmount!: number | null;

  @Column({ type: 'varchar', nullable: true })
  public cycleUnit!: CycleUnit | null;

  @Column()
  public activateAfterDays!: number;

  @Column()
  public deactivateAfterDays!: number;

  @Column()
  public notificationTries!: number;

  @Column()
  public notificationTitle!: string;

  @Column()
  public notificationBodyNew!: string;

  @Column()
  public notificationBodyInProgress!: string;

  @Column({ type: 'varchar', nullable: true })
  public notificationWeekday!: string | null;

  @Column({ type: 'integer', nullable: true })
  public notificationInterval!: number | null;

  @Column({ type: 'varchar', nullable: true })
  public notificationIntervalUnit!: string | null;

  @Column({ type: 'date', nullable: true })
  public activateAtDate!: Date | null;

  @Column({ type: 'boolean', nullable: true })
  public complianceNeeded!: boolean | null;

  @Column()
  public expiresAfterDays!: number;

  @Column()
  public finalisesAfterDays!: number;

  @Column({ type: 'varchar', nullable: true })
  public type!: QuestionnaireType | null;

  @Column({ type: 'varchar', nullable: true })
  public publish!: string | null;

  @Column({ type: 'boolean', nullable: true })
  public notifyWhenNotFilled!: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  public notifyWhenNotFilledTime!: string | null;

  @Column({ type: 'integer', nullable: true })
  public notifyWhenNotFilledDay!: number | null;

  @Column({ type: 'integer', nullable: true })
  public cyclePerDay!: number | null;

  @Column({ type: 'integer', nullable: true })
  public cycleFirstHour!: number | null;

  @Column({ type: 'boolean', nullable: true })
  public keepAnswers!: boolean | null;

  @Column()
  public active!: boolean;

  @CreateDateColumn({ type: 'date', nullable: true })
  public readonly createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  public readonly updatedAt!: Date | null;

  @OneToMany(() => Question, (question) => question.questionnaire, {
    cascade: true,
  })
  public questions?: Question[];

  @OneToOne(() => Condition, (condition) => condition.conditionQuestionnaire, {
    cascade: true,
  })
  public condition?: Condition | null;
}
