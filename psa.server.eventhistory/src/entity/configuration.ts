/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ConfigurationDto } from '../models/configurationDto';

@Entity({ name: 'configuration' })
export class Configuration {
  @PrimaryColumn({ type: 'text' })
  public id!: keyof ConfigurationDto;

  @Column({ type: 'text' })
  public value!: unknown;
}
