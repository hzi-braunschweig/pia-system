import { CommandOptions } from './cli';
declare type commandFn = (root: string, options: CommandOptions) => Promise<void>;
export declare const asyncPassErrors: (fn: commandFn) => commandFn;
export {};
