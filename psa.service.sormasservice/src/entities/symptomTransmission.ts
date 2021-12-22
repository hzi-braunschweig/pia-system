/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['questionnaireInstanceId', 'version'])
export class SymptomTransmission {
  @PrimaryGeneratedColumn()
  public readonly id!: number;

  @Column()
  @Index()
  public pseudonym!: string;

  @Column()
  public study!: string;

  @Column()
  public questionnaireInstanceId!: number;

  @Column()
  public version!: number;

  @Column({ type: 'timestamptz' })
  public transmissionDate!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public readonly updatedAt!: Date;
}
