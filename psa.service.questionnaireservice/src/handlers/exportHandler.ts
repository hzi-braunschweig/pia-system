/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ExportInteractor,
  ExportOptions,
} from '../interactors/exportInteractor';
import { StreamTimeout } from '@pia/lib-service-core';
import { pipeline } from 'stream';
import { Lifecycle } from '@hapi/hapi';

export interface ExportPayload {
  token: string;
  exportOptions: ExportOptions;
}

export class ExportHandler {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  private static readonly streamTimeout = 60 * 60 * 5000; // 5 hour

  /**
   * Creates a data search and returns the search result
   */
  public static createOne: Lifecycle.Method = async (request, h) => {
    const payload = request.payload as ExportPayload;
    const exportOptions = payload.exportOptions;

    try {
      request.log(['export'], 'Start export');
      const streamTimeout = new StreamTimeout(ExportHandler.streamTimeout);
      const stream = await ExportInteractor.export(exportOptions);
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
        // the user will retrieve the zip file with every instance that was created before the error occured
        stream.abort();
      });
      /**
       * The stream timeout ensures that export streams close after a
       * request is aborted by the client. This is a workaround for an open bug
       * in hapi: {@link https://github.com/hapijs/hapi/issues/4244}
       */
      pipeline(stream, streamTimeout, (err) => {
        if (err) {
          request.log(['export'], 'Export pipeline failed with Error:');
          request.log(['export'], err);
        } else {
          request.log(['export'], 'Export pipeline finished successfully.');
        }
      });
      return h.response(streamTimeout).type('application/zip');
    } catch (err) {
      request.log(['export'], 'Export failed');
      if (err instanceof Error) {
        request.log(err.toString());
      }
      throw err;
    }
  };
}
