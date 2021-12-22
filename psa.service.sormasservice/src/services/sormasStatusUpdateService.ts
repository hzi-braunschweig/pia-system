/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SormasClient } from '../clients/sormasClient';
import { userserviceClient } from '../clients/userserviceClient';

export class SormasStatusUpdateService {
  public static async complianceCreate(pseudonym: string): Promise<void> {
    const ids = await userserviceClient.lookupIds(pseudonym);
    if (!ids) {
      console.log('unable to get ids for user');
      throw new Error();
    }
    await SormasClient.setStatus(ids, 'ACCEPTED');
  }

  public static async userDelete(pseudonym: string): Promise<void> {
    const ids = await userserviceClient.lookupIds(pseudonym);
    if (!ids) {
      console.log('unable to get ids for user');
      throw new Error();
    }
    await SormasClient.setStatus(ids, 'DELETED');
  }
}
