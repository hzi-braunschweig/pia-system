import { HttpClient } from './httpClient';
export declare abstract class ServiceClient {
    private readonly serviceUrl;
    protected httpClient: HttpClient;
    constructor(serviceUrl: string);
    waitForService(retryCount?: number, delay?: number): Promise<void>;
}
