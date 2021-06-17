/// <reference types="node" />
export declare class ConfigUtils {
    static getEnvVariable(key: string, fallback?: string): string;
    static getFileContent(path: string): Buffer;
}
