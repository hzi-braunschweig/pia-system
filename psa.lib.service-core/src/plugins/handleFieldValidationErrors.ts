/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Boom, Payload } from '@hapi/boom';
import { Plugin, Server } from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';
import { FieldErrors, ValidateError } from 'tsoa';

export const HandleFieldValidationErrors: Plugin<unknown> = {
  name: 'field-validation-error',
  version: '1.0.0',
  register: function (server: Server) {
    server.ext('onPreResponse', (request, h) => {
      if (
        request.response instanceof Boom &&
        isValidateError(request.response)
      ) {
        request.response = asBoom(request.response.fields);
      }

      return h.continue;
    });
  },
};

function asBoom(fields: FieldErrors): Boom {
  return new Boom<FieldErrors>(getMessage(fields), {
    statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
    data: fields,
  });
}

function getMessage(fields: FieldErrors): string {
  return (
    'Payload is invalid:\n' +
    Object.entries(fields)
      .map(
        ([fieldName, field]) =>
          `${fieldName}: ${String(field.value)} --> ${field.message}`
      )
      .join('\n')
  );
}

function isValidateError(
  response: Boom | (Boom & ValidateError)
): response is Boom & ValidateError {
  const payload: Payload & { name?: string } = response.output.payload;
  return payload.name === 'ValidateError';
}
