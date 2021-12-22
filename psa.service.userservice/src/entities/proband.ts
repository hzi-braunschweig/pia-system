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
  @Column({ type: 'enum', enum: ProbandStatus })
  public status!: ProbandStatus;
  @Column({ type: 'varchar', nullable: true })
  public ids!: string | null;
  @Column({ type: 'varchar', nullable: true })
  public studyCenter!: string | null;
  @Column({ type: 'integer', nullable: true })
  public examinationWave!: number | null;
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
  @Column({ type: 'varchar', nullable: false })
  public mappingId!: string;

  @ManyToOne(() => Study)
  @JoinColumn({
    name: 'study',
    referencedColumnName: 'name',
  })
  public study?: Study;
}
