/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { Study } from './study';

@Entity()
export class PlannedProband {
  @PrimaryColumn({ name: 'user_id' })
  public pseudonym!: string;
  @Column()
  public password!: string;
  @Column({ type: 'timestamp', nullable: true })
  public activatedAt!: Date | null;

  @ManyToMany(() => Study)
  @JoinTable({
    name: 'study_planned_probands',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'pseudonym',
    },
    inverseJoinColumn: {
      name: 'study_id',
      referencedColumnName: 'name',
    },
  })
  public studies?: Study[];
}
