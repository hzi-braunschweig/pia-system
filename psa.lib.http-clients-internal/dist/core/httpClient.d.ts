export declare type ResponseType = 'json' | 'text';
export interface RequestOptions {
    responseType?: ResponseType;
    returnNullWhenNotFound?: boolean;
    headers?: Record<string, string>;
}
export declare class HttpClient {
    private readonly serviceUrl;
    static readonly fetch: typeof import("node-fetch");
    private static readonly defaultRequestOptions;
    constructor(serviceUrl: string);
    get<T>(url: string, options?: RequestOptions): Promise<T>;
    post<T>(url: string, body: unknown, options?: RequestOptions): Promise<T>;
    put<T>(url: string, body: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(url: string, body: unknown, options?: RequestOptions): Promise<T>;
    delete(url: string): Promise<void>;
    private fetch;
}
