/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transform, TransformCallback } from 'stream';

/**
 * Transform stream which closes a stream after a given timeout
 */
export class StreamTimeout<T> extends Transform {
  private readonly timeout: NodeJS.Timeout;

  public constructor(timeout: number) {
    super();
    this.timeout = setTimeout(() => {
      console.warn(
        `Stream timeout reached after ${timeout}ms. Closing stream.`
      );
      this.end();
      this.destroy();
    }, timeout);
  }

  public _transform(
    chunk: T,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.push(chunk);
    callback();
  }

  public _flush(callback: TransformCallback): void {
    clearTimeout(this.timeout);
    callback();
  }
}
