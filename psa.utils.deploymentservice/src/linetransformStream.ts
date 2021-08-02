/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transform, TransformCallback } from 'stream';

export type LineTransformCallback = (line: string) => string | null;

/**
 * a TransformStream that accepts a callback to manipulate a
 * stream line-by-line
 */
export class LineTransformStream extends Transform {
  private lineBuffer = '';

  public constructor(
    private readonly transform: LineTransformCallback,
    private readonly encoding?: BufferEncoding
  ) {
    super({
      transform: (
        chunk: string | Buffer,
        transformEncoding: BufferEncoding,
        callback: TransformCallback
      ) => {
        this.internalTransform(chunk, transformEncoding, callback);
      },
      flush: (callback: TransformCallback) => {
        this.internalFlush(callback);
      },
      encoding,
    });
  }

  private internalFlush(callback: TransformCallback): void {
    callback(null, this.transform(this.lineBuffer));
    this.lineBuffer = '';
  }

  private internalTransform(
    chunk: string | Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    chunk = chunk.toString(this.encoding);

    if (chunk === '') {
      callback(null, null);
      return;
    }

    const lines: string[] = chunk.split('\n');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    lines[0] = this.lineBuffer + lines[0]!;
    const lastPart = lines.pop();
    if (!lastPart) {
      this.lineBuffer = '';
    } else {
      this.lineBuffer = lastPart;
    }

    const output = lines
      .map(this.transform)
      .filter((value: string | null) => value !== null);

    if (output.length === 0) {
      callback(null, null);
      return;
    }

    callback(null, output.join('\n') + '\n');
  }
}
