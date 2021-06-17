/// <reference types="node" />
import { AccessToken } from '../auth/authModel';
export declare function getSecretOrPrivateKey(basePath: string): Buffer;
export declare function signToken(payload: AccessToken, secret: string | Buffer): string;
