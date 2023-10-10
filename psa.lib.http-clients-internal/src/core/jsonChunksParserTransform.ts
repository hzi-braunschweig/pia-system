/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transform, TransformCallback } from 'stream';
import * as os from 'os';

/**
 * A transform stream that parses JSON objects from a stream of chunks.
 *
 * The chunks are expected to be separated by a given separator where
 * every separated string contains one parsable JSON object.
 * The last chunk may not be a complete JSON object. In this case the chunk
 * is buffered and concatenated with the next chunk.
 */
export class JsonChunksParserTransform extends Transform {
  private buffer = '';

  public constructor(private readonly chunkSeparator: string = os.EOL) {
    super({ readableObjectMode: true, writableObjectMode: false });
  }

  public _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.buffer += chunk.toString('utf-8');
    const lines = this.buffer.split(this.chunkSeparator);
    this.buffer = lines.pop() ?? '';
    lines.forEach((line) => this.push(JSON.parse(line)));
    callback();
  }
}
