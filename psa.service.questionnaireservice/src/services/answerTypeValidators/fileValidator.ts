/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../models/answer';
import { isUserFileDto } from '../../models/userFile';
import { UserFileService } from '../userFileService';

export default function fileValidator(value: AnswerValue): string | null {
  if (!isUserFileDto(value)) {
    return 'expected: UserFileDto';
  }

  const { mimeType, base64Data } =
    UserFileService.extractMimeTypeAndFileContent(value.file);

  if (!mimeType || !base64Data) {
    return 'expected: UserFileDto.file to be a base64 data string';
  }

  if (
    !(
      ['application/pdf', 'application/vnd.ms-excel'].includes(mimeType) ||
      mimeType.includes('csv')
    ) ||
    !UserFileService.mimeTypeMatchesContent(base64Data, mimeType)
  ) {
    return 'expected: UserFileDto.file to be a pdf or csv';
  }

  return null;
}
