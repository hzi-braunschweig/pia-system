/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Role } from '../models/role';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AllowedIp {
  @PrimaryColumn()
  public ip!: string;
  @Column({ type: 'varchar' })
  public allowedRole!: Role;
}
