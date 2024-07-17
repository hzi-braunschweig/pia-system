export declare function asyncMap<I, O>(array: I[], callback: (entry: I, index: number, array: I[]) => Promise<O>): Promise<O[]>;
export declare function asyncForEach<T>(array: T[], callback: (entry: T, index: number, array: T[]) => Promise<void>): Promise<void>;
export declare function asyncMapParallel<I, O>(array: I[], callback: (entry: I, index: number, array: I[]) => Promise<O>, maxParallel: number): Promise<O[]>;
export declare function asyncForEachParallel<T>(array: T[], callback: (entry: T, index: number, array: T[]) => Promise<void>, maxParallel: number): Promise<void>;
