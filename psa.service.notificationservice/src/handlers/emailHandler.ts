/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Lifecycle, Request } from '@hapi/hapi';
import { EmailInteractor } from '../interactors/emailInteractor';
import { EmailRequest } from '../models/email';

import { AccessToken } from '@pia/lib-service-core';

/**
 * @description hapi handler for sending emails
 */
export class EmailHandler {
  /**
   * Sends given payload to multiple probands' via mail
   */
  public static sendEmail: Lifecycle.Method = async (request: Request) => {
    return EmailInteractor.sendEmailToProbands(
      request.auth.credentials as AccessToken,
      request.payload as EmailRequest
    );
  };
}
