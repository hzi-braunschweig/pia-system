/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import {
  ExportInteractor,
  ExportOptions,
} from '../interactors/exportInteractor';
import { AccessToken } from '@pia/lib-service-core';
import { PassThrough } from 'stream';

export class ExportHandler {
  /**
   * Creates a data search and returns the search result
   */
  public static createOne: Lifecycle.Method = async (request, h) => {
    try {
      request.log(['export'], 'Start export');
      const stream = await ExportInteractor.export(
        request.auth.credentials as AccessToken,
        request.payload as ExportOptions
      );
      stream.on('end', () => {
        request.log(['export'], 'Export finished.');
        request.log(['export'], `Downloaded ${stream.pointer()} Bytes`);
      });
      stream.on('warning', (err: Error) => {
        request.log(['export'], 'Warning in export:');
        request.log(['export'], err);
      });
      stream.on('error', (err: Error) => {
        request.log(['export'], 'Export failed with Error:');
        request.log(['export'], err);
      });
      return h.response(stream.pipe(new PassThrough())).type('application/zip');
    } catch (err) {
      request.log(['export'], 'Export failed');
      if (err instanceof Error) {
        request.log(err.toString());
      }
      throw err;
    }
  };
}
