/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionnaireInstance } from './questionnaireInstance';
import { Condition } from './condition';

@Entity()
export class QuestionnaireInstanceOrigin {
  @PrimaryGeneratedColumn()
  public id!: number;

  @CreateDateColumn()
  public createdAt!: Date;

  @OneToOne(() => QuestionnaireInstance, (instance) => instance.id)
  @JoinColumn()
  public originInstance!: QuestionnaireInstance;

  @OneToOne(() => QuestionnaireInstance)
  @JoinColumn()
  public createdInstance!: QuestionnaireInstance;

  @OneToOne(() => Condition, (condition) => condition.id)
  @JoinColumn()
  public condition!: Condition;
}
