import { Injectable } from '@angular/core';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  constructor(private firebaseX: FirebaseX) {}

  set(count: number): void {
    this.firebaseX.setBadgeNumber(count);
  }

  clear() {
    this.firebaseX.setBadgeNumber(0);
    this.firebaseX.clearAllNotifications();
  }
}
