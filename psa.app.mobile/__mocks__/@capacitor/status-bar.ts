/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const StatusBar = {
  async setOverlaysWebView(data: { overlay: boolean }): Promise<void> {},
  async setStyle(data: { style: 'DARK' | 'LIGHT' }): Promise<void> {},
  async setBackgroundColor(data: { color: string }): Promise<void> {},
  async hide(): Promise<void> {},
  async show(): Promise<void> {},
};

export enum Style {
  Dark = 'DARK',
  Light = 'LIGHT',
}
