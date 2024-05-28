/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { SampleId } from '../models/customTypes';
import { SampleDto } from '../models/sample';
import { SampleService } from './sampleService';

const prefix = 'PREFIX';
const suffixLength = 10;
const differentPrefix = 'DIFFERENT';
const differentSuffixLength = 5;

const sampleId: SampleId = 'PREFIX-1034567890';
const dummySampleId: SampleId = 'PREFIX-1134567891';
const wrongSampleId: SampleId = 'PREFIX-1234567890';
const wrongDummySampleId: SampleId = 'PREFIX-1234567891';
const invalidID: SampleId = '-1234567891FOO';

describe('SampleService', () => {
  context('parseSampleId', () => {
    it('should parse a sample ID without a prefix', () => {
      expect(SampleService.parseSampleId('123456789')).to.deep.equal({
        prefix: null,
        suffix: '123456789',
      });
    });
    it('should parse a sample ID with a prefix', () => {
      expect(SampleService.parseSampleId('PREFIX-12121212')).to.deep.equal({
        prefix: 'PREFIX',
        suffix: '12121212',
      });
    });
    it('should throw an error if sample ID is invalid', () => {
      expect(() => SampleService.parseSampleId('-21341FOO')).to.throw(
        'Given sample ID is not valid.'
      );
    });
  });

  context('createSampleDtoFrom', () => {
    it('should return a DTO with the first ID if it is the only one', () => {
      const expected: SampleDto = { sampleId: sampleId };
      expect(SampleService.createSampleDtoFrom([sampleId])).to.deep.equal(
        expected
      );
    });

    it('should return a DTO with the correct sample und dummy ID', () => {
      const expected: SampleDto = {
        sampleId: sampleId,
        dummySampleId: dummySampleId,
      };
      expect(
        SampleService.createSampleDtoFrom([sampleId, dummySampleId])
      ).to.deep.equal(expected);
      expect(
        SampleService.createSampleDtoFrom([dummySampleId, sampleId])
      ).to.deep.equal(expected);
    });

    it('should throw an error if sample ID is invalid', () => {
      expect(() =>
        SampleService.createSampleDtoFrom([sampleId, wrongDummySampleId])
      ).to.throw(
        'Could not determine the sample ID and/or the dummy sample ID.'
      );

      expect(() =>
        SampleService.createSampleDtoFrom([wrongSampleId, dummySampleId])
      ).to.throw(
        'Could not determine the sample ID and/or the dummy sample ID.'
      );

      expect(() =>
        SampleService.createSampleDtoFrom([wrongSampleId, wrongDummySampleId])
      ).to.throw(
        'Could not determine the sample ID and/or the dummy sample ID.'
      );

      expect(() => SampleService.createSampleDtoFrom([invalidID])).to.throw(
        'Given sample ID is not valid.'
      );

      expect(() =>
        SampleService.createSampleDtoFrom([invalidID, wrongDummySampleId])
      ).to.throw('Given sample ID is not valid.');

      expect(() => SampleService.createSampleDtoFrom([])).to.throw(
        'Given array is not a sample ID tuple.'
      );

      expect(() =>
        SampleService.createSampleDtoFrom([sampleId, sampleId, sampleId])
      ).to.throw('Given array is not a sample ID tuple.');
    });
  });

  context('isSampleDtoValid', () => {
    const testCases: {
      params: Parameters<typeof SampleService.isSampleDtoValid>;
      expected: boolean;
    }[] = [
      {
        params: [{ sampleId }, prefix, suffixLength],
        expected: true,
      },
      {
        params: [{ sampleId }, differentPrefix, suffixLength],
        expected: false,
      },
      {
        params: [{ sampleId }, prefix, differentSuffixLength],
        expected: false,
      },
      {
        params: [{ sampleId }, differentPrefix, differentSuffixLength],
        expected: false,
      },
      {
        params: [{ sampleId: 'FOO-123' }, prefix, suffixLength],
        expected: false,
      },
      {
        params: [{ sampleId, dummySampleId }, prefix, suffixLength],
        expected: true,
      },
      {
        params: [{ sampleId, dummySampleId }, differentPrefix, suffixLength],
        expected: false,
      },
      {
        params: [{ sampleId, dummySampleId }, prefix, differentSuffixLength],
        expected: false,
      },
      {
        params: [
          { sampleId, dummySampleId },
          differentPrefix,
          differentSuffixLength,
        ],
        expected: false,
      },
      {
        params: [
          {
            sampleId: 'FOO-123',
            dummySampleId: 'FOO-123',
          },
          prefix,
          suffixLength,
        ],
        expected: false,
      },
      {
        params: [
          {
            sampleId,
            dummySampleId: 'FOO-123',
          },
          prefix,
          suffixLength,
        ],
        expected: false,
      },
      {
        params: [
          {
            sampleId: 'FOO-123',
            dummySampleId,
          },
          prefix,
          suffixLength,
        ],
        expected: false,
      },
    ];

    for (const testCase of testCases) {
      it(`should return ${
        testCase.expected ? 'true' : 'false'
      } for ${JSON.stringify(testCase.params)}`, () => {
        expect(SampleService.isSampleDtoValid(...testCase.params)).to.equal(
          testCase.expected
        );
      });
    }
  });
});
