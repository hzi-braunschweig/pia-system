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
import { Condition } from './condition';
import { Question } from './question';

@Entity()
export class Questionnaire implements QuestionnaireDto {
  /**
   * @isInt
   */
  @PrimaryColumn()
  public id!: number;

  /**
   * @isInt
   */
  @PrimaryColumn()
  public version!: number;

  @Column({ type: 'varchar' })
  public studyId!: string;

  @Column()
  public name!: string;

  @Column({ type: 'varchar', nullable: true })
  public customName!: string | null;

  /**
   * @isInt
   */
  @Column()
  public noQuestions!: number;

  /**
   * @isInt
   */
  @Column({ type: 'integer', nullable: true })
  public cycleAmount!: number | null;

  @Column({ type: 'varchar', nullable: true })
  public cycleUnit!: CycleUnit | null;

  /**
   * @isInt
   */
  @Column()
  public activateAfterDays!: number;

  /**
   * @isInt
   */
  @Column()
  public deactivateAfterDays!: number;

  /**
   * @isInt
   */
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

  /**
   * @isInt
   */
  @Column({ type: 'integer', nullable: true })
  public notificationInterval!: number | null;

  @Column({ type: 'varchar', nullable: true })
  public notificationIntervalUnit!: string | null;

  @Column({ type: 'date', nullable: true })
  public activateAtDate!: Date | null;

  @Column({ type: 'boolean', nullable: true })
  public complianceNeeded!: boolean | null;

  /**
   * @isInt
   */
  @Column()
  public expiresAfterDays!: number;

  /**
   * @isInt
   */
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

  /**
   * @isInt
   */
  @Column({ type: 'integer', nullable: true })
  public notifyWhenNotFilledDay!: number | null;

  /**
   * @isInt
   */
  @Column({ type: 'integer', nullable: true })
  public cyclePerDay!: number | null;

  /**
   * @isInt
   */
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

export type HasQuestionnaireRelation<T extends { questionnaire?: unknown }> =
  Omit<T, 'questionnaire'> & Required<Pick<T, 'questionnaire'>>;

export function hasQuestionnaireRelation<T extends { questionnaire?: unknown }>(
  obj: Partial<Pick<T, 'questionnaire'>>
): obj is HasQuestionnaireRelation<T> {
  return !!obj.questionnaire;
}
