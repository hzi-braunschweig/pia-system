/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { performance } from 'perf_hooks';

export class ExecutionTime {
  private readonly startTime: number;

  public constructor() {
    this.startTime = performance.now();
  }

  public get(): number {
    return performance.now() - this.startTime;
  }

  public toString(): string {
    return `(took ${Math.round(this.get())} ms)`;
  }
}
