/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @description in-memory storage of blocked IPs; or, to be more precise, contains all IPs as all have the potential of being blocked soon
 */

export interface BlockedIpData {
  third_wrong_password_at: number;
  number_of_wrong_attempts: number;
}

export class BlockedIPService {
  // List of last blocked IPs
  private readonly leastRecentUsedIpCache: string[] = [];

  // Blocked IPs data, indexed by IP
  private readonly blockedIPs: Map<string, BlockedIpData> = new Map<
    string,
    BlockedIpData
  >();

  public constructor(private readonly MAX_LRU_CACHE_SIZE: number) {}

  public put(ip: string, data: BlockedIpData): void {
    const lruPositionOfIp = this.leastRecentUsedIpCache.indexOf(ip);
    if (lruPositionOfIp >= 0) {
      this.leastRecentUsedIpCache.splice(lruPositionOfIp, 1);
    } else if (this.leastRecentUsedIpCache.length >= this.MAX_LRU_CACHE_SIZE) {
      const unblockedIp = this.leastRecentUsedIpCache.shift();
      if (unblockedIp) this.blockedIPs.delete(unblockedIp);
    }
    this.leastRecentUsedIpCache.push(ip);
    this.blockedIPs.set(ip, data);
    console.log(this.blockedIPs);
  }

  public get(ip: string): BlockedIpData {
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
