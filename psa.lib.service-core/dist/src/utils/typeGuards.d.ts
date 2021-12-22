export declare function isArrayOfStrings(input: unknown): input is string[];
export declare function hasProperty<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, unknown>;
export declare function hasNonNullishProperty<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, Exclude<unknown, undefined | null>>;
