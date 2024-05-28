/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Represents a base64 encoded file.
 *
 * @pattern ^data:(\w+\/[-+.\w]+);base64,(.+)$
 * @example data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGJaFsIJCAAA//8CrwEGTOqkagAAAABJRU5ErkJggg==
 */
export type base64file = string;

/**
 * Defines a file, consisting of a file name and a base64 encoded file
 */
export interface UserFileDto {
  file: base64file;
  fileName: string;
}

export type UserFileResponse = Pick<UserFile, 'id' | 'file' | 'file_name'>;

export interface UserFile {
  id: number;
  user_id: string;
  questionnaire_instance_id: number;
  answer_option_id: number;
  file_name?: string;
  file: string;
}

export function isUserFileDto(value: unknown): value is UserFileDto {
  return (
    value !== null &&
    typeof value === 'object' &&
    'file' in value &&
    'fileName' in value
  );
}
