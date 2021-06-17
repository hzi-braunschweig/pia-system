/**
 * Mark params or return types as nullable
 *
 * @example
 * function getSomething(id: string): Nullable<Something> {}
 */
export type Nullable<T> = T | null;
