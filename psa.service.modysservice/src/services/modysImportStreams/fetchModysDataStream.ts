/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transform, TransformCallback } from 'stream';
import { Boom } from '@hapi/boom';
import httpStatusCode from 'http-status-codes';

import { config } from '../../config';
import { ModysClient } from '../../clients/modysClient';
import { ModysConfig, PersonSummary } from '../../models/modys';
import { ProbandExternalId } from '../../models/probandExternalId';

export class FetchModysDataStream extends Transform {
  private readonly modysClient = new ModysClient(this.modysConfig);
  private initialized = false;

  public constructor(private readonly modysConfig: ModysConfig) {
    /** readableHighWaterMark is the limit for the buffer of the output that controls the concurrency
     * the FetchModysDataStream pushes requests as Promises into the buffer
     * The number of the requests running in parallel is the readableHighWaterMark of this stream
     * + the writableHighWaterMark of the next writable stream (if piped)
     */
    super({
      objectMode: true,
      readableHighWaterMark: config.modysRequestConcurrency,
    });
  }

  /**
   * The initialization before starting the reading (automatically called from node v15)
   */
  public _construct(): void {
    console.log('MODYS Import: fetching probands from MODYS...');
    this.initialized = true;
  }

  public _transform(
    proband: ProbandExternalId,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (!this.initialized) {
      this._construct();
    }
    this.push(this.getModysProband(proband));
    return callback();
  }

  private async getModysProband({
    pseudonym,
    externalId,
  }: ProbandExternalId): Promise<PersonSummary | null> {
    try {
      const probandId = await this.modysClient
        .getProbandIdentifierbyId(externalId, this.modysConfig.identifierTypeId)
        .catch((e) => {
          console.log(
            'MODYS Import: Could not find identifier for:',
            externalId
          );
          throw e;
        });
      const overview = await this.modysClient
        .getProbandWithId(probandId)
        .catch((e) => {
          console.log(
            'MODYS Import: Could not find proband data for:',
            externalId
          );
          throw e;
        });
      const contactDetails = await this.modysClient
        .getProbandContactDetails(probandId)
        .catch((e) => {
          console.log(
            'MODYS Import: Could not find contact data for:',
            externalId
          );
          throw e;
        });
      return { pseudonym, overview, contactDetails };
    } catch (e) {
      if (
        e instanceof Boom &&
        e.output.statusCode !== httpStatusCode.NOT_FOUND
      ) {
        console.log(e);
      }
      return null;
    }
  }
}
