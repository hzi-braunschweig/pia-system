/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Role } from '../models/role';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface BasicAccount {
  username: string;
  role: Role;
  thirdWrongPasswordAt: Date | null;
  numberOfWrongAttempts: number | null;
}
@Entity()
export class Account implements BasicAccount {
  @PrimaryColumn()
  public username!: string;
  @Column()
  public password!: string;
  @Column()
  public salt!: string;
  @Column({ type: 'varchar' })
  public role!: Role;
  @Column({ type: 'boolean', nullable: true })
  public pwChangeNeeded!: boolean;
  @Column({ type: 'timestamp', nullable: true })
  public initialPasswordValidityDate!: Date | null;
  @Column({ type: 'integer', nullable: true })
  public numberOfWrongAttempts!: number | null;
  @Column({ type: 'timestamp', nullable: true })
  public thirdWrongPasswordAt!: Date | null;
}
