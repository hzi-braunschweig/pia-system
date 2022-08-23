/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import pgHelper from '../services/postgresqlHelper';
import { AnswerType } from '../models/answerOption';
import { Role } from '../models/role';

const allowedTypesForResearchTeam = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const allowedTypesForProband = ['image/jpeg', 'image/png'];

const base64MimeTypeMapping = new Map<string, string>([
  ['JVBERi0', 'application/pdf'],
  ['/9j/', 'image/jpeg'],
  ['iVBORw0KGgo', 'image/png'],
]);

interface Answer {
  question_id: number;
  answer_option_id: number;
  value: string;
}

/**
 * validates the file and image answer types
 * @param answers a list of answers, that should be checked
 * @param role the role for wich it should be checked (a Proband has other permissions than a ResearchTeam member)
 * @return {Promise<{isValid: boolean}>} A promise that returns ture if valid, otherwise false
 */
export async function isFileContentAllowed(
  answers: Answer[],
  role: Role
): Promise<boolean> {
  const answerOptionsIds = answers.map((answer) => answer.answer_option_id);

  const answersOptions = (await pgHelper.getAnswerOptionsWithTypes(
    answerOptionsIds
  )) as { id: number; answer_type_id: AnswerType }[];

  for (const answer of answers) {
    if (
      !(
        answersOptions.some(
          (ao) =>
            ao.id === answer.answer_option_id &&
            [AnswerType.File, AnswerType.Image].includes(ao.answer_type_id)
        ) && answer.value
      )
    ) {
      // Answer type is neither file nor image, therefore no validation is required
      continue;
    }
    const jsonContent = JSON.parse(answer.value) as { data: string };
    if (typeof jsonContent === 'object') {
      const base64ContentArray = jsonContent.data.split(',');
      const providedMimeType = base64ContentArray[0]?.match(
        /[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/
      )?.[0];
      const base64FileContent = base64ContentArray[1];
      if (!isMimeTypeSupported(providedMimeType, base64FileContent, role)) {
        return false;
      }
    }
  }
  return true;
}

function isMimeTypeSupported(
  mimeType: string | undefined,
  base64Data: string | undefined,
  role: Role
): boolean {
  // CSV files do not have a specific signature, nor they have a specific mimetype
  // therefore a type check based on the base64 content is not possible
  if (mimeType?.includes('csv') || mimeType === 'application/vnd.ms-excel') {
    return true;
  }

  // an empty file is not allowed
  if (!base64Data) {
    return false;
  }

  // Check if mimeType exists based on the file content and user role
  if (role === 'Proband') {
    return detectMimeTypeForProband(base64Data) !== undefined;
  } else if (role === 'Untersuchungsteam') {
    return detectMimeTypeForResearchTeam(base64Data) !== undefined;
  } else {
    // Other roles are not allowed to upload files
    return false;
  }
}

function detectMimeTypeForResearchTeam(
  base64Content: string
): string | undefined {
  for (const [prefix, mimeType] of base64MimeTypeMapping) {
    if (
      base64Content.startsWith(prefix) &&
      allowedTypesForResearchTeam.includes(mimeType)
    ) {
      return mimeType;
    }
  }
  return undefined;
}

function detectMimeTypeForProband(base64Content: string): string | undefined {
  for (const [prefix, mimeType] of base64MimeTypeMapping) {
    if (
      base64Content.startsWith(prefix) &&
      allowedTypesForProband.includes(mimeType)
    ) {
      return mimeType;
    }
  }
  return undefined;
}
