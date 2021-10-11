/// <reference types="node" />
export declare class ConfigUtils {
    static getEnvVariable(key: string, fallback?: string): string;
    static getEnvVariableInt(key: string, fallback?: number): number;
    static getFileContent(path: string): Buffer;
}
