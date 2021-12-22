/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Entity, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class SormasOneTimeToken {
  @PrimaryColumn()
  public token!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  public readonly createdAt!: Date;
}
