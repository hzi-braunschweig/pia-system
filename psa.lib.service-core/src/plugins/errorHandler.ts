/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Plugin, Server } from '@hapi/hapi';
import StatusCodes from 'http-status-codes';
import Boom from '@hapi/boom';
import { hasNonNullishProperty } from '../utils/typeGuards';

/**
 * An error with a causedBy property, that can be another error or any reason
 * that caused throwing this error and might help to understand the error.
 */
export abstract class ErrorWithCausedBy extends Error {
  public constructor(
    message?: string,
    public readonly causedBy?: Error | unknown
  ) {
    super(message);
  }
}

/**
 * Not just any HTTP code error but a more specific one, that can be handled by the ErrorHandler plugin.
 * The errorCode will be sent to the client additionally to the statusCode (= the HTTP code).
 */
export abstract class SpecificError extends ErrorWithCausedBy {
  public abstract readonly statusCode: number;
  public abstract readonly errorCode: string;
}

const INDENTATION = 2;

/**
 * A hapi plugin that logs any error (synchronously) thrown in the handler depending on the http code.
 * Server side errors will be logged more in detail (with an error stack) than client side errors.
 */
export const ErrorHandler: Plugin<unknown> = {
  name: 'error-handler',
  version: '1.0.0',
  register: function (server: Server) {
    server.ext('onPreResponse', (r, h) => {
      if (r.response instanceof Error) {
        if (r.response instanceof SpecificError) {
          Boom.boomify(r.response, {
            statusCode: r.response.statusCode,
          });
          r.response.output.payload['errorCode'] = r.response.errorCode;
          r.log(
            'info',
            `${r.response.output.statusCode} [${r.response.errorCode}] - ${r.response.message}` +
              createCausedByLog(r.response)
          );
        } else if (
          r.response.output.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR
        ) {
          r.log(
            'error',
            `${r.response.output.statusCode} - ${r.response.stack ?? ''}` +
              createCausedByLog(r.response, true) +
              ' ' +
              JSON.stringify(r.response, null, INDENTATION)
          );
        } else {
          r.log(
            'warn',
            `${r.response.output.statusCode} - ${r.response.message}` +
              createCausedByLog(r.response)
          );
        }
      }
      return h.continue;
    });
  },
};

function createCausedByLog(err: unknown, withStack = false): string {
  if (hasNonNullishProperty(err, 'causedBy')) {
    if (err.causedBy instanceof Error) {
      return (
        '\nCaused By: ' +
        (withStack ? err.causedBy.stack ?? '' : err.causedBy.message) +
        createCausedByLog(err.causedBy, withStack)
      );
    } else {
      return '\nCaused By: ' + String(err.causedBy);
    }
  } else {
    return '';
  }
}
