/// <reference types="node" />
import { Writable } from 'stream';
export declare class WriteIntoArrayStream<T> extends Writable {
    private readonly array;
    constructor(array: T[]);
    _write(chunk: T, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
}
