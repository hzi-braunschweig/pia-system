/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueService } from '../services/messageQueueService';
import { LoginWebAppProxy } from './loginWebAppProxy';

export class LoginMobileAppProxy extends LoginWebAppProxy {
  public readonly pattern =
    'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-mobile-app-client.LOGIN';

  public static async build(
    messageQueueService: MessageQueueService
  ): Promise<LoginMobileAppProxy> {
    const producer = await this.createProbandLoggedInProducer(
      messageQueueService
    );

    const instance = new this();
    instance.producer = producer;

    return instance;
  }
}
