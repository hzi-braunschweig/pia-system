export declare type Nullable<T> = T | null;
export declare type DeepPartial<T> = {
    [K in keyof T]?: DeepPartial<T[K]>;
};
