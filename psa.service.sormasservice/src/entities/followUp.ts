/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class FollowUp {
  @PrimaryGeneratedColumn()
  public readonly id!: number;

  @Column({ unique: true })
  public pseudonym!: string;

  @Column()
  public study!: string;

  @Column({ type: 'timestamptz', nullable: true })
  public endDate!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public readonly updatedAt!: Date;
}
