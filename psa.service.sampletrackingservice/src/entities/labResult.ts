/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum LabResultStatus {
  New = 'new',
  Analyzed = 'analyzed',
  Inactive = 'inactive',
}

export enum StudyStatus {
  Active = 'active',
  Deactivated = 'deactivated',
  DeletionPending = 'deletion_pending',
  Deleted = 'deleted',
}

@Entity()
export class LabResult {
  @PrimaryColumn()
  public id!: string;

  @Column({ type: 'varchar', nullable: true, name: 'dummy_sample_id' })
  public dummyId!: string;

  @Column({ name: 'user_id' })
  public pseudonym!: string;

  @Column({ type: 'timestamptz', nullable: true })
  public dateOfSampling!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  public remark!: string | null;

  @Column()
  public status!: LabResultStatus;

  @Column({ type: 'boolean', nullable: true })
  public newSamplesSent!: boolean | null;

  @Column({ type: 'text', nullable: true })
  public performingDoctor!: string | null;

  @Column()
  public studyStatus!: StudyStatus;
}
