/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyInternalDto } from '@pia-system/lib-http-clients-internal';
import { expect } from 'chai';
import { AnswerOption } from '../entities/answerOption';
import { AnswerValue } from '../models/answer';
import { AnswerType } from '../models/answerOption';
import { AnswerService } from './answerService';
import { AnswerValidatorService } from './answerValidatorService';

describe('AnswerValidatorService', () => {
  const base64Files = {
    jpgOk: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBg',
    jpgWrongMime:
      'data:image/png;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBg',
    jpgWrongContent:
      'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAA',
    pngOk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAA',
    pngWrongContent:
      'data:image/png;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBg',
    pngWrongMime:
      'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAA',
    pdfOk:
      'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3',
    pdfWrongMime:
      'data:image/png;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3',
    pdfWrongContent:
      'data:application/pdf;base64,VXNlcm5hbWU7IElkZW50aWZpZXI7Rmlyc3QgbmFtZT',
    csvPlain:
      'data:text/x-csv;base64,VXNlcm5hbWU7IElkZW50aWZpZXI7Rmlyc3QgbmFtZT',
    csvExcel:
      'data:application/vnd.ms-excel;base64,VXNlcm5hbWU7IElkZW50aWZpZXI7',
  };

  context('isValueValidForAnswerType', () => {
    interface TestCase {
      label: string;
      expected: string | null;
      value: AnswerValue;
      study: Partial<StudyInternalDto>;
    }

    const testCases: { [key in AnswerType]?: TestCase[] } = {
      [AnswerType.Image]: [
        {
          label: 'png is ok',
          expected: null,
          study: {},
          value: { fileName: 'foo.png', file: base64Files.pngOk },
        },
        {
          label: 'value is not UserFileDto',
          expected: 'expected: UserFileDto',
          study: {},
          value: '',
        },
        {
          label: 'file is empty',
          expected: 'expected: UserFileDto.file to be a base64 data string',
          study: {},
          value: { fileName: 'foo.jpg', file: '' },
        },
        {
          label: 'png has wrong mime',
          expected: 'expected: UserFileDto.file to be an image',
          study: {},
          value: { fileName: 'foo.png', file: base64Files.pngWrongMime },
        },
        {
          label: 'png has wrong content',
          expected: 'expected: UserFileDto.file to be an image',
          study: {},
          value: { fileName: 'foo.png', file: base64Files.pngWrongContent },
        },
        {
          label: 'jpg is ok',
          expected: null,
          study: {},
          value: { fileName: 'foo.jpg', file: base64Files.jpgOk },
        },
        {
          label: 'jpg has wrong mime',
          expected: 'expected: UserFileDto.file to be an image',
          study: {},
          value: { fileName: 'foo.jpg', file: base64Files.jpgWrongMime },
        },
        {
          label: 'jpg has wrong content',
          expected: 'expected: UserFileDto.file to be an image',
          study: {},
          value: { fileName: 'foo.jpg', file: base64Files.jpgWrongContent },
        },
      ],
      [AnswerType.File]: [
        {
          label: 'value is not UserFileDto',
          expected: 'expected: UserFileDto',
          study: {},
          value: '',
        },
        {
          label: 'file is empty',
          expected: 'expected: UserFileDto.file to be a base64 data string',
          study: {},
          value: { fileName: 'foo.pdf', file: '' },
        },
        {
          label: 'pdf is ok',
          expected: null,
          study: {},
          value: { fileName: 'foo.pdf', file: base64Files.pdfOk },
        },
        {
          label: 'pdf has wrong mime',
          expected: 'expected: UserFileDto.file to be a pdf or csv',
          study: {},
          value: { fileName: 'foo.pdf', file: base64Files.pdfWrongMime },
        },
        {
          label: 'pdf has wrong content',
          expected: 'expected: UserFileDto.file to be a pdf or csv',
          study: {},
          value: { fileName: 'foo.pdf', file: base64Files.pdfWrongContent },
        },
        {
          label: 'plain csv is ok',
          expected: null,
          study: {},
          value: { fileName: 'foo.csv', file: base64Files.csvPlain },
        },
        {
          label: 'excel csv is ok',
          expected: null,
          study: {},
          value: { fileName: 'foo.csv', file: base64Files.csvExcel },
        },
      ],
      [AnswerType.Sample]: [
        {
          label: 'sample required sampleDummyId is missing',
          expected: 'expected: SampleDto.sampleDummyId',
          study: { has_rna_samples: true },
          value: { sampleId: 'PREFIX-1034567890' },
        },
        {
          label: 'sample required sampleDummyId exists',
          expected: null,
          study: { has_rna_samples: true },
          value: {
            sampleId: 'PREFIX-1034567890',
            dummySampleId: 'PREFIX-1134567890',
          },
        },
        {
          label: 'sample ID does not match study settings',
          expected: 'expected: Sample IDs in SampleDto to match ^FOO-[0-9]{3}$',
          study: { sample_prefix: 'FOO', sample_suffix_length: 3 },
          value: { sampleId: 'BAR-1234' },
        },
        {
          label: 'sample ID does match study settings',
          expected: null,
          study: { sample_prefix: 'FOO', sample_suffix_length: 3 },
          value: { sampleId: 'FOO-123' },
        },
      ],
    };

    for (const [key, typeTestCases] of Object.entries(testCases)) {
      const answerType = parseInt(key);
      const answerTypeString = AnswerService.getAnswerTypeString(answerType);

      context(`answer type "${answerTypeString}"`, () => {
        for (const testCase of typeTestCases) {
          const { value, expected, label, study } = testCase;

          it(`should return "${expected ?? 'null'}" when ${label}`, () => {
            const answerOption: Partial<AnswerOption> = {
              answerTypeId: answerType,
            };

            expect(
              AnswerValidatorService.isValueValidForAnswerType(
                study as StudyInternalDto,
                answerOption as AnswerOption,
                value
              )
            ).to.equal(expected);
          });
        }
      });
    }
  });
});
