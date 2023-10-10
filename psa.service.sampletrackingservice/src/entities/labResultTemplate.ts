/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LabResultTemplate {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    unique: true,
  })
  public study!: string;

  @Column()
  public markdownText!: string;
}
