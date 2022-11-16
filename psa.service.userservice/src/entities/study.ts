/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Study {
  @PrimaryColumn()
  public name!: string;
  @Column()
  public has_logging_opt_in!: boolean;
  @Column()
  public pseudonym_prefix!: string;
  @Column()
  public pseudonym_suffix_length!: number;
}
