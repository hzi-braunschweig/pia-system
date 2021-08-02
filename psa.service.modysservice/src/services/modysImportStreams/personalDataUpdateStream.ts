/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Boom } from '@hapi/boom';
import { StatusCodes } from 'http-status-codes';

import { PersonaldataserviceClient } from '../../clients/personaldataserviceClient';
import { PersonalDataReq } from '../../models/personalData';
import { TransformCallback, Writable } from 'stream';
import { PersonalDataMapperStreamOutput } from './personalDataMapperStream';

export interface UpdateResult {
  successfull: number;
  notFound: number;
  error: number;
}

export class PersonalDataUpdateStream extends Writable {
  private readonly updateResult: UpdateResult = {
    successfull: 0,
    notFound: 0,
    error: 0,
  };

  public constructor() {
    super({ objectMode: true });
  }

  public _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    console.log(
      `MODYS Import: ${this.updateResult.successfull} entries have been successfully imported.`
    );
    console.log(
      `MODYS Import: ${this.updateResult.notFound} entries have not been imported, because the proband could not be found in pia.`
    );
    console.log(
      `MODYS Import: ${this.updateResult.error} entries could not be imported with unknown reason.`
    );
    super._destroy(error, callback);
  }

  public async _write(
    personalDataChunk: PersonalDataMapperStreamOutput,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): Promise<void> {
    await this.updatePersonalData(
      personalDataChunk.pseudonym,
      personalDataChunk.personalData
    );
    callback();
  }

  /**
   * Bulk imports or updates a map of PersonalData via the personaldataservice.
   * Returns a summary of the import results.
   */
  public async updatePersonalData(
    pseudonym: string,
    personalData: PersonalDataReq
  ): Promise<void> {
    try {
      await PersonaldataserviceClient.updatePersonalData(
        pseudonym,
        personalData
      );
      this.updateResult.successfull++;
    } catch (error) {
      if ((error as Boom).output.statusCode === StatusCodes.NOT_FOUND) {
        this.updateResult.notFound++;
      } else {
        console.error(
          'PersonalDataUpdateStream: could not update personal data.',
          error
        );
        this.updateResult.error++;
      }
    }
  }
}
