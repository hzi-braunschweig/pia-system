/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Study } from './study';
import { ProbandStatus } from '../models/probandStatus';

@Entity({ name: 'probands' })
export class Proband {
  @PrimaryColumn()
  public pseudonym!: string;

  @Column({ type: 'varchar', nullable: true })
  public ids!: string | null;

  @Column({ type: 'enum', enum: ProbandStatus })
  public status!: ProbandStatus;

  @Column({ type: 'varchar', nullable: true })
  public studyCenter!: string | null;

  @Column({ type: 'integer', nullable: true })
  public examinationWave!: number | null;

  @Column({ type: 'boolean', nullable: true })
  public needsMaterial!: boolean | null;

  @Column({ type: 'date', nullable: true })
  public firstLoggedInAt!: Date | null;

  @Column()
  public complianceContact!: boolean;
  @Column()
  public complianceLabresults!: boolean;
  @Column()
  public complianceSamples!: boolean;
  @Column()
  public complianceBloodsamples!: boolean;

  @Column({ type: 'boolean', nullable: true })
  public loggingActive!: boolean | null;

  @Column()
  public isTestProband!: boolean;

  /**
   * ID which maps a proband to its compliance data
   */
  @Column({ type: 'varchar', nullable: false, select: false })
  public mappingId!: string;
  @Column({ type: 'timestamptz', nullable: true })
  public deactivatedAt!: Date;
  @Column({ type: 'timestamptz', nullable: true })
  public deletedAt!: Date;

  /**
   * ID or pseudonym which was provided by an external system (e.g. NatCoEdc)
   */
  @Column({ type: 'varchar', nullable: true, select: false })
  public externalId!: string;

  @ManyToOne(() => Study)
  @JoinColumn({
    name: 'study',
    referencedColumnName: 'name',
  })
  public study?: Study;
}
