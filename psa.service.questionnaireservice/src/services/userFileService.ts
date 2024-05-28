/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getRepository } from 'typeorm';
import { AnswerOption } from '../entities/answerOption';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import { UserFile } from '../entities/userFile';
import { UserFileDto } from '../models/userFile';

const mimeTypeMagicBase64Bytes = new Map<string, string>([
  ['application/pdf', 'JVBERi0'],
  ['image/jpeg', '/9j/'],
  ['image/png', 'iVBORw0KGgo'],
]);

export class UserFileService {
  public static async createOrUpdate(
    questionnaireInstance: QuestionnaireInstance,
    answerOption: AnswerOption,
    fileDto: UserFileDto
  ): Promise<UserFile> {
    if (fileDto.file === '' || fileDto.fileName === '') {
      throw new Error(
        'create or updating user file failed, because file or fileName cannot be empty'
      );
    }

    const repository = getRepository(UserFile);
    const existingFile = await repository.findOne({
      where: {
        questionnaireInstance,
        answerOption,
        userId: questionnaireInstance.pseudonym,
      },
    });

    if (existingFile) {
      const result = await repository.update(existingFile, fileDto);

      if (result.affected === 0) {
        throw new Error('updating file failed');
      }

      return { ...existingFile, ...fileDto, ...result.generatedMaps[0] };
    }

    const result = await repository
      .createQueryBuilder()
      .insert()
      .values({
        userId: questionnaireInstance.pseudonym,
        questionnaireInstance: questionnaireInstance,
        answerOption: answerOption,
        file: fileDto.file,
        fileName: fileDto.fileName,
      })
      .returning('*')
      .execute();

    const newFile = repository.create(result.generatedMaps)[0];

    if (!newFile) {
      throw new Error('inserting file failed');
    }

    return newFile;
  }

  public static extractMimeTypeAndFileContent(dataBase64: string): {
    mimeType: string | undefined;
    base64Data: string | undefined;
  } {
    const parts = /^data:(\w+\/[-+.\w]+);base64,(.+)$/.exec(dataBase64);

    if (!parts) {
      return { mimeType: undefined, base64Data: undefined };
    }

    const [, mimeType, base64Data] = parts;

    return { mimeType, base64Data };
  }

  /**
   * Checks if the base64 content matches the expected MIME type.
   * If we do not know how to check for a MIME type, this method will just return true.
   */
  public static mimeTypeMatchesContent(
    base64data: string,
    mimeType: string
  ): boolean {
    const prefix = mimeTypeMagicBase64Bytes.get(mimeType);

    if (!prefix) {
      return true;
    }

    return base64data.startsWith(prefix);
  }
}
