/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { formatISO } from 'date-fns';
import { PostAnswerRequestDto } from '../../../../src/controllers/public/dtos/postAnswerDto';

export const JPEG_BASE64 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';

export const answerQ1A1: PostAnswerRequestDto = {
  questionVariableName: 'question_1',
  answerOptionVariableName: 'answer_option_1',
  value: 1,
};
export const answerQ1A2: PostAnswerRequestDto = {
  questionVariableName: 'question_1',
  answerOptionVariableName: 'answer_option_2',
  value: [99, 1],
};
export const answerQ1A3: PostAnswerRequestDto = {
  questionVariableName: 'question_1',
  answerOptionVariableName: 'answer_option_3',
  value: 9,
};
export const answerQ1A4: PostAnswerRequestDto = {
  questionVariableName: 'question_1',
  answerOptionVariableName: 'answer_option_4',
  value: 'Some text',
};
export const answerQ1A5: PostAnswerRequestDto = {
  questionVariableName: 'question_1',
  answerOptionVariableName: 'answer_option_5',
  value: formatISO(new Date(), { representation: 'date' }),
};
export const answerQ2A6: PostAnswerRequestDto = {
  questionVariableName: 'question_2',
  answerOptionVariableName: 'answer_option_6',
  value: 0,
};
export const answerQ2A7: PostAnswerRequestDto = {
  questionVariableName: 'question_2',
  answerOptionVariableName: 'answer_option_7',
  value: {
    file: JPEG_BASE64,
    fileName: 'test.jpeg',
  },
};
export const answerQ2A8: PostAnswerRequestDto = {
  questionVariableName: 'question_2',
  answerOptionVariableName: 'answer_option_8',
  value: {
    sampleId: 'SAMPLE-1034567801',
    dummySampleId: 'SAMPLE-1134567811',
  },
};
export const answerQ2A9: PostAnswerRequestDto = {
  questionVariableName: 'question_2',
  answerOptionVariableName: 'answer_option_9',
  value: '-12345678',
};
export const answerQ2A10: PostAnswerRequestDto = {
  questionVariableName: 'question_2',
  answerOptionVariableName: 'answer_option_10',
  value: formatISO(new Date()),
};
export const answerQ2A11: PostAnswerRequestDto = {
  questionVariableName: 'question_2',
  answerOptionVariableName: 'answer_option_11',
  value: 'conditional answer option',
};
export const answerQ3A12: PostAnswerRequestDto = {
  questionVariableName: 'question_3',
  answerOptionVariableName: 'answer_option_12',
  value: 'conditional question',
};

export function getCompletePostAnswersRequest(): PostAnswerRequestDto[] {
  return [
    answerQ1A1,
    answerQ1A2,
    answerQ1A3,
    answerQ1A4,
    answerQ1A5,
    answerQ2A6,
    answerQ2A7,
    answerQ2A8,
    answerQ2A9,
    answerQ2A10,
  ];
}
