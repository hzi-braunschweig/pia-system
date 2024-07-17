/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export default interface NotificationContentStrategy<T> {
  initialize(relation: T): void;

  getInAppTitle(): string;

  getInAppText(): string;

  getEmailContent(): { subject: string; text: string; html: string };

  getAdditionalData(): Record<string, unknown> | null;
}
