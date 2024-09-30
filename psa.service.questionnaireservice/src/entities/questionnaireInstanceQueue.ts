/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { QuestionnaireInstance } from './questionnaireInstance';

@Entity({ name: 'questionnaire_instances_queued' })
export class QuestionnaireInstanceQueue {
  @PrimaryColumn()
  @Column({ name: 'user_id' })
  public pseudonym!: string;

  @OneToOne(() => QuestionnaireInstance, { primary: true })
  @JoinColumn({ name: 'questionnaire_instance_id' })
  public questionnaireInstance!: QuestionnaireInstance;

  @Column()
  public dateOfQueue!: Date;
}
