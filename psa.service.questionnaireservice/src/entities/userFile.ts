/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AnswerOption } from './answerOption';
import { QuestionnaireInstance } from './questionnaireInstance';
import { UserFileDto } from '../models/userFile';

@Entity()
export class UserFile implements UserFileDto {
  @PrimaryColumn()
  public id!: number;

  @Column()
  public userId!: string;

  @Column()
  public file!: string;

  @Column()
  public fileName!: string;

  @JoinColumn({ name: 'questionnaire_instance_id', referencedColumnName: 'id' })
  public questionnaireInstance?: QuestionnaireInstance;

  @ManyToOne(() => AnswerOption, { primary: true })
  @JoinColumn({ name: 'answer_option_id', referencedColumnName: 'id' })
  public answerOption?: AnswerOption;
}
