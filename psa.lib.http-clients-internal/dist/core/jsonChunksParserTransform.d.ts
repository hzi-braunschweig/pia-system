/// <reference types="node" />
/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
export declare class JsonChunksParserTransform extends Transform {
    private readonly chunkSeparator;
    private buffer;
    constructor(chunkSeparator?: string);
    _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void;
}
