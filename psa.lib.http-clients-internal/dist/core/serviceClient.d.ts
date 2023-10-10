import { HttpClient } from './httpClient';
export declare abstract class ServiceClient {
    protected readonly serviceUrl: string;
    protected httpClient: HttpClient;
    constructor(serviceUrl: string);
    waitForService(retryCount?: number, delay?: number): Promise<void>;
}
