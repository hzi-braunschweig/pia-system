/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class LoggingService {
  public constructor(private readonly scope: string) {}

  /**
   * Use this level to log helpful information about usual user or system actions
   * @param message
   */
  public info(message: string): void {
    console.info(`(ℹ️) ${this.scope}: ${message}`);
  }

  /**
   * Use this level to indicate that the system ran in into a known issue which might
   * need to be further investigated
   * @param message
   */
  public warn(message: string): void {
    console.warn(`(⚠️) ${this.scope}: ${message}`);
  }

  /**
   * Use this level only if the system ran into a serious error which should not
   * occur under normal circumstances. These errors should always be investigated
   * as soon as they appear.
   * @param message
   */
  public error(message: string): void {
    console.error(`(❌️) ${this.scope}: ${message}`);
  }

  public printQuestionnaire(questionnaire: {
    name: string;
    id: number;
    version: number;
  }): string {
    return `"${questionnaire.name}" (#${questionnaire.id} v${questionnaire.version})`;
  }
}
