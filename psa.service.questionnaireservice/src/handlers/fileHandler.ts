/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import { AccessToken } from '@pia/lib-service-core';
import { FileInteractor } from '../interactors/fileInteractor';
import { UserFileDto } from '../models/userFile';

export class FileHandler {
  /**
   * Get one image as base64 coded
   * @param request
   */
  public static getFileById: Lifecycle.Method = async (
    request
  ): Promise<UserFileDto> => {
    const file = await FileInteractor.getFileById(
      request.params['id'] as string,
      request.auth.credentials as AccessToken
    );
    return {
      id: file.id,
      file: file.file,
      file_name: file.file_name,
    };
  };
}
