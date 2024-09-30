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
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  QuestionnaireInstanceDto,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { Questionnaire } from './questionnaire';
import { Answer } from './answer';
import { QuestionnaireInstanceOrigin } from './questionnaireInstanceOrigin';

@Entity({
  orderBy: {
    sortOrder: 'ASC',
    id: 'ASC',
  },
})
export class QuestionnaireInstance implements QuestionnaireInstanceDto {
  /** @isInt */
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public studyId!: string;

  @ManyToOne(() => Questionnaire)
  @JoinColumn([
    { name: 'questionnaire_id', referencedColumnName: 'id' },
    {
      name: 'questionnaire_version',
      referencedColumnName: 'version',
    },
  ])
  public questionnaire?: Questionnaire;

  @Column()
  public questionnaireName!: string;

  /** @isInt */
  @Column({ type: 'smallint', nullable: true })
  public sortOrder!: number | null;

  @Column({ name: 'user_id' })
  public pseudonym!: string;

  @Column()
  public dateOfIssue!: Date;

  @Column({ type: 'timestamp', nullable: true })
  public dateOfReleaseV1!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  public dateOfReleaseV2!: Date | null;

  /** @isInt */
  @Column()
  public cycle!: number;

  @Column({ type: 'varchar' })
  public status!: QuestionnaireInstanceStatus;

  @Column({ type: 'boolean', nullable: true })
  public notificationsScheduled!: boolean | null;

  /** @isInt */
  @Column({ type: 'integer', nullable: true })
  public progress!: number | null;

  /** @isInt */
  @Column({ type: 'integer', nullable: true })
  public releaseVersion!: number | null;

  @OneToMany(() => Answer, (answer) => answer.questionnaireInstance)
  public answers?: Answer[];

  @OneToOne(
    () => QuestionnaireInstanceOrigin,
    (origin) => origin.createdInstance,
    { cascade: true }
  )
  public origin?: QuestionnaireInstanceOrigin | null;
}
