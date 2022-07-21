/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Request } from '@hapi/hapi';
import { EmailInteractor } from '../interactors/emailInteractor';
import { EmailRequest } from '../models/emailRequest';

import { AccessToken } from '@pia/lib-service-core';

/**
 * @description hapi handler for sending emails
 */
export class EmailHandler {
  /**
   * Sends given payload to multiple probands' via mail
   */
  public static async sendEmail(
    this: void,
    request: Request
  ): Promise<string[]> {
    return EmailInteractor.sendEmailToProbands(
      request.auth.credentials as AccessToken,
      request.payload as EmailRequest
    );
  }
}
