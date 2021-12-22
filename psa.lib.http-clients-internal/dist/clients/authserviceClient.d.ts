import { ServiceClient } from '../core/serviceClient';
import { CreateAccountRequestInternalDto } from '../dtos/user';
export declare class AuthserviceClient extends ServiceClient {
    createAccount(user: CreateAccountRequestInternalDto): Promise<void>;
    deleteAccount(username: string): Promise<void>;
}
