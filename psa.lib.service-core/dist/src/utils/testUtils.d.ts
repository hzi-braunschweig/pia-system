/// <reference types="node" />
import sinon from 'sinon';
import { AccessToken } from '../auth/authModel';
export declare type SinonMethodStub<M extends (...args: any[]) => any> = sinon.SinonStub<Parameters<M>, ReturnType<M>>;
export declare function getSecretOrPrivateKey(basePath: string): Buffer;
export declare function signToken(payload: AccessToken, secret: string | Buffer): string;
