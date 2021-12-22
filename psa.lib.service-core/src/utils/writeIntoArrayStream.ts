/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Writable } from 'stream';

export class WriteIntoArrayStream<T> extends Writable {
  public constructor(private readonly array: T[]) {
    super({ objectMode: true });
  }

  public _write(
    chunk: T,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.array.push(chunk);
    callback();
  }
}
