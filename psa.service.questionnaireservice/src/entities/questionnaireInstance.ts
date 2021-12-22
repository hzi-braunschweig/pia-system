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
  PrimaryColumn,
} from 'typeorm';
import {
  QuestionnaireInstanceStatus,
  QuestionnaireInstanceDto,
} from '../models/questionnaireInstance';
import { Questionnaire } from './questionnaire';
import { Answer } from './answer';

@Entity()
export class QuestionnaireInstance implements QuestionnaireInstanceDto {
  @PrimaryColumn()
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

  @Column({ name: 'user_id' })
  public pseudonym!: string;

  @Column()
  public dateOfIssue!: Date;

  @Column({ type: 'timestamp', nullable: true })
  public dateOfReleaseV1!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  public dateOfReleaseV2!: Date | null;

  @Column()
  public cycle!: number;

  @Column({ type: 'varchar' })
  public status!: QuestionnaireInstanceStatus;

  @Column({ type: 'boolean', nullable: true })
  public notificationsScheduled!: boolean | null;

  @Column({ type: 'integer', nullable: true })
  public progress!: number | null;

  @Column({ type: 'integer', nullable: true })
  public releaseVersion!: number | null;

  @OneToMany(() => Answer, (answer) => answer.questionnaireInstance)
  public answers?: Answer[];

  /**
   * @deprecated will be deleted after migration
   */
  @Column({ type: 'timestamp', nullable: true })
  public transmissionTsV1?: Date | null;

  /**
   * @deprecated will be deleted after migration
   */
  @Column({ type: 'timestamp', nullable: true })
  public transmissionTsV2?: Date | null;
}
