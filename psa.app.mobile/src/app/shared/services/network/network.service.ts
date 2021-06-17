import { Injectable } from '@angular/core';
import { merge, Observable } from 'rxjs';
import { Network } from '@ionic-native/network/ngx';
import { distinctUntilChanged, map } from 'rxjs/operators';

export enum ConnectionStatus {
  Online,
  Offline,
}

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private status: ConnectionStatus = ConnectionStatus.Online;

  constructor(private network: Network) {
    this.getConnectionStatus().subscribe((status) => (this.status = status));
  }

  public getNetworkType(): string {
    return this.network.type;
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

  private getConnectionStatus(): Observable<ConnectionStatus> {
    return merge(
      this.network.onDisconnect().pipe(map(() => ConnectionStatus.Offline)),
      this.network.onConnect().pipe(map(() => ConnectionStatus.Online))
    ).pipe(distinctUntilChanged());
  }
}
