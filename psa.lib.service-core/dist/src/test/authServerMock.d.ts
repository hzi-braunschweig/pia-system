import { Scope } from 'nock';
export declare class AuthServerMock {
    private readonly realmName;
    private readonly instance;
    private constructor();
    static probandRealm(this: void): AuthServerMock;
    static adminRealm(this: void): AuthServerMock;
    static cleanAll(this: void): void;
    returnError(message?: string): Scope;
    returnInvalid(): Scope;
    returnValid(): Scope;
}
