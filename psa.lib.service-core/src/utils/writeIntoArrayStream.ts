import { Writable } from 'stream';

export class WriteIntoArrayStream<T> extends Writable {
  public constructor(private readonly array: T[]) {
    super({ objectMode: true });
  }

  public _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.array.push(chunk);
    callback();
  }
}
