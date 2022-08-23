/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryColumn } from 'typeorm';

export type StudyAccessLevel = 'read' | 'write' | 'admin';

@Entity({ name: 'study_users' })
export class StudyAccess {
  @PrimaryColumn({ name: 'study_id' })
  public studyName!: string;

  @PrimaryColumn({ name: 'user_id' })
  public username!: string;

  @Column()
  public accessLevel!: StudyAccessLevel;
}
