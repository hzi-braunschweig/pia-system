"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedIPService = void 0;
class BlockedIPService {
    constructor(MAX_LRU_CACHE_SIZE) {
        this.MAX_LRU_CACHE_SIZE = MAX_LRU_CACHE_SIZE;
        this.leastRecentUsedIpCache = [];
        this.blockedIPs = new Map();
    }
    put(ip, data) {
        const lruPositionOfIp = this.leastRecentUsedIpCache.indexOf(ip);
        if (lruPositionOfIp >= 0) {
            this.leastRecentUsedIpCache.splice(lruPositionOfIp, 1);
        }
        else if (this.leastRecentUsedIpCache.length >= this.MAX_LRU_CACHE_SIZE) {
            const unblockedIp = this.leastRecentUsedIpCache.shift();
            if (unblockedIp)
                this.blockedIPs.delete(unblockedIp);
        }
        this.leastRecentUsedIpCache.push(ip);
        this.blockedIPs.set(ip, data);
        console.log(this.blockedIPs);
    }
    get(ip) {
        const blockedIP = this.blockedIPs.get(ip);
        if (blockedIP) {
            return blockedIP;
        }
        return {
            number_of_wrong_attempts: 0,
            third_wrong_password_at: 0,
        };
    }
}
exports.BlockedIPService = BlockedIPService;
//# sourceMappingURL=blockedIPService.js.map