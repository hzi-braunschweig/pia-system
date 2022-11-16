/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'study_welcome_mails' })
export class StudyWelcomeMail {
  @PrimaryColumn()
  public studyName!: string;

  @Column()
  public subject!: string;

  @Column()
  public markdownText!: string;
}
