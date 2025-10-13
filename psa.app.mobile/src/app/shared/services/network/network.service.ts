/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  Network,
  ConnectionStatus as CapacitorConnectionStatus,
} from '@capacitor/network';

export enum ConnectionStatus {
  Online,
  Offline,
}

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private status: ConnectionStatus = ConnectionStatus.Online;
  private networkType: string = 'unknown';

  constructor() {}

  public getNetworkType(): string {
    return this.networkType;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isOnline(): boolean {
    return this.status === ConnectionStatus.Online;
  }

  public isOffline(): boolean {
    return this.status === ConnectionStatus.Offline;
  }

  public async initialize() {
    const status = await Network.getStatus();
    this.setNetworkStatus(status);
    await Network.addListener('networkStatusChange', (newStatus) => {
      this.setNetworkStatus(newStatus);
    });
  }

  private setNetworkStatus(status: CapacitorConnectionStatus) {
    this.status = status.connected
      ? ConnectionStatus.Online
      : ConnectionStatus.Offline;
    this.networkType = status.connectionType;
  }
}
