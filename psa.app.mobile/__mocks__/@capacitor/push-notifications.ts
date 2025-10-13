/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type PermissionState =
  | 'prompt'
  | 'prompt-with-rationale'
  | 'granted'
  | 'denied';

export const PushNotifications = {
  async removeAllDeliveredNotifications(): Promise<void> {},
  async register(): Promise<void> {},
  async unregister(): Promise<void> {},
  async removeAllListeners(): Promise<void> {},
  async requestPermissions(): Promise<{ receive: PermissionState }> {
    return { receive: 'prompt' };
  },
  async checkPermissions(): Promise<{ receive: PermissionState }> {
    return { receive: 'granted' };
  },
  addListener(eventName: string, listenerFunc: any) {
    return Promise.resolve({
      remove: () => Promise.resolve(),
    });
  },
};

export type PushNotificationsPlugin = typeof PushNotifications;
