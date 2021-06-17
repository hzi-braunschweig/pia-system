import { expect } from 'chai';
import stream, { Readable, Writable } from 'stream';
import * as util from 'util';

import {
  LineTransformCallback,
  LineTransformStream,
} from './linetransformStream';

const pipeline = util.promisify(stream.pipeline);

async function streamTransform(
  input: string,
  transform: LineTransformCallback
): Promise<string> {
  const str = new LineTransformStream(transform, 'utf-8');

  const readable = Readable.from(input);

  let output = '';
  const writable = new Writable({
    write: (
      chunk: string,
      _encoding: BufferEncoding,
      callback: (error?: Error | null) => void
    ): void => {
      output += chunk;
      callback(null);
    },
  });

  await pipeline(readable, str, writable);
  return output;
}

function createPassthroughTest(input: string): void {
  it(`transparently passes a string with "${input.replace(
    new RegExp('\\n', 'g'),
    '\\n'
  )}"`, async () => {
    expect(await streamTransform(input, (line) => line)).to.equal(input);
  });
}

function createAppendTest(input: string): void {
  it(`appends a token to each line with "${input.replace(
    new RegExp('\\n', 'g'),
    '\\n'
  )}"`, async () => {
    expect(await streamTransform(input, (line) => line + 'X')).to.equal(
      input.replace(new RegExp('\\n', 'g'), 'X\n') + 'X'
    );
  });
}

function createNullTest(input: string): void {
  it(`removes null line with "${input.replace(
    new RegExp('\\n', 'g'),
    '\\n'
  )}"`, async () => {
    expect(await streamTransform(input, () => null)).to.equal('');
  });
}

describe('LineTransformStream', () => {
  const testStrings: string[] = [
    'Hello\nWorld\n1234\n\nEnde',
    'single',
    '\n\n\n',
    '\n',
    '',
  ];

  testStrings.forEach(createPassthroughTest);
  testStrings.forEach(createAppendTest);
  testStrings.forEach(createNullTest);
});
