/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Boom } from '@hapi/boom';
import { StatusCodes } from 'http-status-codes';
import { getConnection, getRepository } from 'typeorm';
import { sampletrackingserviceClient } from '../clients/sampletrackingserviceClient';
import { Answer } from '../entities/answer';
import { AnswerOption } from '../entities/answerOption';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import { UserFile } from '../entities/userFile';
import {
  CouldNotCreateOrUpdateAnswersError,
  SampleTrackingServiceRejectedSampleIdError,
} from '../errors';
import { AnswerValue, PartialAnswerDto } from '../models/answer';
import { AnswerType } from '../models/answerOption';
import { QuestionnaireInstanceStatus } from '../models/questionnaireInstance';
import { isSampleDto, SampleDto } from '../models/sample';
import { isUserFileDto, UserFileDto } from '../models/userFile';
import { SampleService } from './sampleService';
import { UserFileService } from './userFileService';

export class AnswerService {
  public static async find(
    instance: QuestionnaireInstance,
    releaseVersion?: number
  ): Promise<Answer[]> {
    return await getRepository(Answer).find({
      relations: ['answerOption', 'question'],
      where: {
        questionnaireInstance: instance,
        versioning: releaseVersion ?? instance.releaseVersion,
      },
    });
  }

  public static async count(
    instance: QuestionnaireInstance,
    releaseVersion?: number
  ): Promise<number> {
    return await getRepository(Answer).count({
      where: {
        questionnaireInstance: instance,
        versioning: releaseVersion ?? instance.releaseVersion,
      },
    });
  }

  public static async copyToVersion(
    instance: QuestionnaireInstance,
    targetReleaseVersion: number
  ): Promise<Answer[]> {
    const answers = await this.find(instance);

    answers.forEach((a) => {
      a.versioning = targetReleaseVersion;
      a.questionnaireInstance = instance;
    });
    await getRepository(Answer).insert(answers);

    return await this.find(instance, targetReleaseVersion);
  }

  public static async createOrUpdate(
    instance: QuestionnaireInstance,
    partialAnswers: PartialAnswerDto[]
  ): Promise<Answer[]> {
    if (!this.statusAllowsToCreateOrUpdateAnswers(instance.status)) {
      throw new CouldNotCreateOrUpdateAnswersError(
        `Questionnaire instance status is "${instance.status}" and does not allow to write answers`
      );
    }

    const qr = getConnection().createQueryRunner();
    await qr.startTransaction();

    const answersRepository = qr.manager.getRepository(Answer);

    try {
      const answers: Answer[] = [];

      for (const answerDto of partialAnswers) {
        const { answerOption, question, value } = answerDto;

        if (!answerOption || !question) {
          console.error(
            `Ensure your answers contain a reference to a question and answer option`
          );
          throw new CouldNotCreateOrUpdateAnswersError();
        }

        const existingAnswer = await answersRepository.findOne({
          relations: ['answerOption', 'question'],
          where: {
            question,
            answerOption,
            questionnaireInstance: instance,
            versioning: instance.releaseVersion,
          },
          order: {
            versioning: 'DESC',
          },
        });

        const nextAnswerVersion = this.determineAnswerVersion(
          instance,
          existingAnswer
        );

        const updatedAnswerFields: Partial<Answer> = {
          versioning: nextAnswerVersion,
          dateOfRelease: this.determineDateOfRelease(existingAnswer),
          value: await this.encodeAnswerValue(instance, answerOption, value),
        };

        if (existingAnswer && existingAnswer.versioning === nextAnswerVersion) {
          const result = await answersRepository.update(
            existingAnswer,
            updatedAnswerFields
          );
          if (result.affected !== undefined && result.affected > 0) {
            answers.push(
              answersRepository.merge(existingAnswer, updatedAnswerFields)
            );
          }
        } else {
          const result = await answersRepository.save({
            question,
            answerOption,
            releasingPerson: null,
            questionnaireInstance: instance,
            ...updatedAnswerFields,
          });
          answers.push(result);
        }
      }

      await qr.commitTransaction();

      return answers;
    } catch (e: unknown) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  public static statusAllowsToCreateOrUpdateAnswers(
    status: QuestionnaireInstanceStatus
  ): boolean {
    const allowedStatus: QuestionnaireInstanceStatus[] = [
      'active',
      'in_progress',
      'released_once',
      'released',
    ];
    return allowedStatus.includes(status);
  }

  public static async saveAndEncodeAnswerValueFile(
    instance: QuestionnaireInstance,
    answerOption: AnswerOption,
    value: UserFileDto
  ): Promise<string> {
    const file = await UserFileService.createOrUpdate(
      instance,
      answerOption,
      value
    );
    return String(file.id);
  }

  public static async encodeAnswerValue(
    instance: QuestionnaireInstance,
    answerOption: AnswerOption,
    value: AnswerValue
  ): Promise<string> {
    if (value === null) {
      return '';
    }

    switch (answerOption.answerTypeId) {
      case AnswerType.Image:
      case AnswerType.File:
        if (isUserFileDto(value)) {
          return String(
            await this.saveAndEncodeAnswerValueFile(
              instance,
              answerOption,
              value
            )
          );
        }
        return '';
      case AnswerType.SingleSelect:
        if (typeof value !== 'number') {
          throw Error(
            'Single select answers are expected to be a numeric value code'
          );
        }
        return this.encodeSelectCodeValue(
          answerOption.valuesCode ?? [],
          answerOption.values ?? [],
          value
        );
      case AnswerType.MultiSelect:
        // At this point, typescript can infer that the type must be number[], as there is no other type of array in the
        // AnswerValue union type. If the union type changes, we need to extend the following type check.
        if (!Array.isArray(value)) {
          throw Error(
            'Multi select answers are expected to be an array of numeric value codes'
          );
        }
        return this.encodeSelectCodeValues(
          answerOption.valuesCode ?? [],
          answerOption.values ?? [],
          value
        );
      case AnswerType.Sample:
        if (isSampleDto(value)) {
          return await this.saveAndEncodeAnswerValueSample(instance, value);
        }
        return '';
      default:
        return String(value);
    }
  }

  /**
   * Encodes a select code value.
   *
   * @param codes - Array of codes used for decoding.
   * @param values - Array of values mapped to the codes.
   * @param codeValue - The code value to encode.
   * @return The encoded value.
   */
  public static encodeSelectCodeValue(
    codes: number[],
    values: string[],
    codeValue: number
  ): string {
    const index = codes.indexOf(codeValue);
    return values[index] ?? '';
  }

  /**
   * Encodes select code values.
   *
   * @param codes - Array of codes used for decoding.
   * @param values - Array of values mapped to the codes.
   * @param codeValues - The array of code values.
   * @return The encoded code values joined with ';'.
   */
  public static encodeSelectCodeValues(
    codes: number[],
    values: string[],
    codeValues: number[]
  ): string {
    return codeValues
      .map((code) => this.encodeSelectCodeValue(codes, values, code))
      .join(';');
  }

  /**
   * Decodes the select value by finding the corresponding code based on the given value.
   *
   * @param codes - Array of codes used for decoding.
   * @param values - Array of values mapped to the codes.
   * @param {string} value - The value to decode.
   * @return {number | null} - The decoded value as a number, or null if the value is not found.
   */
  public static decodeSelectValue(
    codes: number[],
    values: string[],
    value: string
  ): number {
    const index = values.indexOf(value);
    const code = codes[index];

    if (code === undefined) {
      const msgValues = values.join(', ');
      const msgCodes = codes.join(', ');
      throw Error(
        `You tried to decode "${value}" but a corresponding value was not found in [${msgValues}] / [${msgCodes}]`
      );
    }

    return code;
  }

  /**
   * Decodes concatenated select values, which were stored as semicolon separated string: "Yes;No;I do not know".
   *
   * @param codes - Array of codes used for decoding.
   * @param values - Array of values mapped to the codes.
   * @param value - Concatenated select values, separated by comma.
   * @returns Array of value codes. Returns null for values which have no corresponding code value.
   */
  public static decodeConcatenatedSelectValues(
    codes: number[],
    values: string[],
    value: string
  ): number[] {
    return value
      .split(';')
      .map((v) => this.decodeSelectValue(codes, values, v));
  }

  public static getAnswerTypeString(
    type?: AnswerType
  ): keyof typeof AnswerType {
    const typeString =
      Object.keys(AnswerType)[Object.values(AnswerType).indexOf(type ?? -1)];

    if (!typeString) {
      throw Error(
        `the answer type "${
          type ?? '?'
        }" does not exist, therefore has no string representation`
      );
    }

    return typeString as keyof typeof AnswerType;
  }

  public static async decodeAnswerValue(
    answerOption: AnswerOption,
    value: string
  ): Promise<AnswerValue> {
    // any value which is not a text, should be null and not an empty string when being empty
    if (value === '' && answerOption.answerTypeId !== AnswerType.Text) {
      return null;
    }

    switch (answerOption.answerTypeId) {
      case AnswerType.None:
      case AnswerType.Text:
      case AnswerType.Date:
      case AnswerType.Timestamp:
        return value;
      case AnswerType.Image:
      case AnswerType.File: {
        const userFileId = parseFloat(value);
        let file: { file_name: string } | undefined;

        if (!isNaN(userFileId)) {
          file = await getConnection()
            .getRepository(UserFile)
            .createQueryBuilder()
            .select(['file_name'])
            .where({ id: userFileId })
            .getRawOne<{ file_name: string }>();
        }

        if (!file) {
          throw new Error(
            `Could not decode answer value for type "${answerOption.answerTypeId}" with user_files.id "${userFileId}"`
          );
        }

        return {
          file: '', // we do not return the encoded file to preserve memory and bandwidth
          fileName: file.file_name,
        };
      }
      case AnswerType.Number:
        return parseFloat(value);
      case AnswerType.SingleSelect:
        return this.decodeSelectValue(
          answerOption.valuesCode ?? [],
          answerOption.values ?? [],
          value
        );
      case AnswerType.MultiSelect:
        return this.decodeConcatenatedSelectValues(
          answerOption.valuesCode ?? [],
          answerOption.values ?? [],
          value
        );
      case AnswerType.Sample: {
        return SampleService.createSampleDtoFrom(value.split(';'));
      }
      default:
        return value;
    }
  }

  private static async saveAndEncodeAnswerValueSample(
    instance: QuestionnaireInstance,
    value: SampleDto
  ): Promise<string> {
    try {
      await sampletrackingserviceClient.patchSample(
        instance.studyId,
        instance.pseudonym,
        value.sampleId,
        {
          dummyId: value.dummySampleId,
          dateOfSampling: new Date(),
        }
      );

      return isSampleDto(value) ? Object.values(value).join(';') : '';
    } catch (e: unknown) {
      let message = 'Unknown error while processing sample ID';
      if (e instanceof Boom) {
        switch (e.output.statusCode) {
          case StatusCodes.NOT_FOUND:
            message =
              'The given sample ID and/or sample dummy ID did not match any lab result';
            break;
          case StatusCodes.UNPROCESSABLE_ENTITY:
            message =
              'The given sample dummy ID did not match the found lab result';
            break;
          case StatusCodes.FORBIDDEN:
            message =
              'Found sample ID in answers, but the participant did not comply to track samples';
            break;
        }
      }

      throw new SampleTrackingServiceRejectedSampleIdError(message);
    }
  }

  private static determineAnswerVersion(
    instance: QuestionnaireInstance,
    answer?: Answer
  ): number | undefined {
    const answerVersion = answer?.versioning ?? instance.releaseVersion ?? 1;

    switch (instance.status) {
      case 'active':
      case 'in_progress':
        return answerVersion !== 0 ? answerVersion : 1;
      case 'released_once':
      case 'released':
        if (instance.releaseVersion === answerVersion) {
          return answerVersion + 1;
        } else {
          return answerVersion !== 0 ? answerVersion : 1;
        }
    }

    return undefined;
  }

  private static determineDateOfRelease(
    answer?: Pick<Answer, 'dateOfRelease'>
  ): Date {
    return answer?.dateOfRelease ? new Date(answer.dateOfRelease) : new Date();
  }
}
