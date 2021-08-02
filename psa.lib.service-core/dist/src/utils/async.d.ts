export declare function asyncForEach<T>(array: T[], callback: (entry: T, index: number, array: T[]) => Promise<void>): Promise<void>;
export declare function asyncMap<I, O>(array: I[], callback: (entry: I, index: number, array: I[]) => Promise<O>): Promise<O[]>;
