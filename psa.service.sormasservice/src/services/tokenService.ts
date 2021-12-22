/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import { getRepository, LessThan } from 'typeorm';
import { SormasOneTimeToken } from '../entities/sormasOneTimeToken';

export class TokenService {
  public static readonly MILLISECONDS_PER_SECOND = 1000;

  public static async storeToken(token: string): Promise<void> {
    await getRepository(SormasOneTimeToken).save({
      token: token,
    });
  }

  public static async deleteOutdated(): Promise<void> {
    await getRepository(SormasOneTimeToken).delete({
      createdAt: LessThan(
        new Date(
          Date.now() -
            config.sormasOnPia.tokenValidity * this.MILLISECONDS_PER_SECOND
        )
      ),
    });
  }

  public static async isValid(token: string): Promise<boolean> {
    const tokenResult = await getRepository(SormasOneTimeToken).findOne(token);
    return (
      !!tokenResult &&
      tokenResult.createdAt.getTime() +
        config.sormasOnPia.tokenValidity * this.MILLISECONDS_PER_SECOND >=
        Date.now()
    );
  }
}
