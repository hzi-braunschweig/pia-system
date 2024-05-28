/// <reference types="node" />
/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
export declare class StreamTimeout<T> extends Transform {
    private readonly timeout;
    constructor(timeout: number);
    _transform(chunk: T, _encoding: BufferEncoding, callback: TransformCallback): void;
    _flush(callback: TransformCallback): void;
}
