import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class BackButtonService {
  private backButtonSubscription: Subscription;

  constructor(private platform: Platform) {}

  disable() {
    this.backButtonSubscription =
      this.platform.backButton.subscribeWithPriority(9999, () => {});
  }

  enable() {
    setTimeout(() => this.backButtonSubscription.unsubscribe(), 200);
  }
}
