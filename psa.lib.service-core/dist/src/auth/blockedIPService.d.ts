export interface BlockedIpData {
    third_wrong_password_at: number;
    number_of_wrong_attempts: number;
}
export declare class BlockedIPService {
    private readonly MAX_LRU_CACHE_SIZE;
    private readonly leastRecentUsedIpCache;
    private readonly blockedIPs;
    constructor(MAX_LRU_CACHE_SIZE: number);
    put(ip: string, data: BlockedIpData): void;
    get(ip: string): BlockedIpData;
}
