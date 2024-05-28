/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SampleId } from '../models/customTypes';
import {
  isArraySampleIdTuple,
  SampleDto,
  SampleIdTuple,
} from '../models/sample';

const SampledIdPrefixRegex = /^(?<prefix>[A-Za-z]+)-(?<suffix>\d+)/;
const SampledIdNumeric = /^(?<suffix>\d+)/;
type SampledIdParts =
  | {
      prefix: string | undefined;
      suffix: string | undefined;
    }
  | undefined;

interface ParsedSampleId {
  prefix: string | null;
  suffix: string;
}

export class SampleService {
  public static createSampleDtoFrom(array: SampleId[]): SampleDto {
    if (!isArraySampleIdTuple(array)) {
      throw Error('Given array is not a sample ID tuple.');
    }

    if (array.length === 1 && typeof array[0] === 'string') {
      if (!this.isSampleIdValid(array[0])) {
        throw Error('Given sample ID is not valid.');
      }
      return { sampleId: array[0] };
    }

    return this.assignSampleIds(array);
  }

  public static parseSampleId(id: SampleId): ParsedSampleId {
    const groups = this.splitSampleId(id);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (!groups?.suffix) {
      throw Error('Given sample ID is not valid.');
    }

    const { prefix, suffix } = groups;

    return {
      prefix: prefix ? prefix.replace('-', '') : null,
      suffix,
    };
  }

  public static isSampleIdValid(id: SampleId | null | undefined): boolean {
    if (!id) {
      return false;
    }

    if (SampledIdPrefixRegex.test(id)) {
      return true;
    }

    return SampledIdNumeric.test(id);
  }

  public static splitSampleId(id: SampleId): SampledIdParts {
    if (SampledIdPrefixRegex.test(id)) {
      return SampledIdPrefixRegex.exec(id)?.groups as SampledIdParts;
    }

    return SampledIdNumeric.exec(id)?.groups as SampledIdParts;
  }

  public static isSampleDtoValid(
    dto: SampleDto,
    prefix: string | null,
    suffixLength: number | null
  ): boolean {
    const sampleIdMatchesStudySettings = this.doesSampleIdMatchStudySettings(
      dto.sampleId,
      prefix,
      suffixLength
    );

    return (
      (sampleIdMatchesStudySettings && !dto.dummySampleId) ||
      (sampleIdMatchesStudySettings &&
        !!dto.dummySampleId &&
        this.doesSampleIdMatchStudySettings(
          dto.dummySampleId,
          prefix,
          suffixLength
        ))
    );
  }

  public static doesSampleIdMatchStudySettings(
    value: SampleId | null | undefined,
    prefix: string | null,
    suffixLength: number | null
  ): value is SampleId {
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regexp = new RegExp(
      this.createSampleIdRegexPattern(prefix, suffixLength),
      'i'
    );
    return !!value && regexp.test(value);
  }

  public static createSampleIdRegexPattern(
    prefix: string | null,
    suffixLength: number | null
  ): string {
    return (
      (prefix ? `^${prefix}-` : '.*') +
      (suffixLength ? `[0-9]{${suffixLength}}$` : '[0-9]*$')
    );
  }

  private static assignSampleIds(sampleIds: SampleIdTuple): SampleDto {
    const [parsedA, parsedB] = sampleIds.map((v) => this.parseSampleId(v));
    const [entryA, entryB] = sampleIds;

    if (entryA && parsedA && entryB && parsedB) {
      const indexA =
        (parsedA.prefix?.length ?? 0) + 1 + (parsedA.prefix ? 1 : 0);

      const indexB =
        (parsedB.prefix?.length ?? 0) + 1 + (parsedB.prefix ? 1 : 0);

      if (entryA.charAt(indexA) === '0' && entryB.charAt(indexB) === '1') {
        return { sampleId: entryA, dummySampleId: entryB };
      } else if (
        entryA.charAt(indexA) === '1' &&
        entryB.charAt(indexB) === '0'
      ) {
        return { sampleId: entryB, dummySampleId: entryA };
      }
    }

    throw Error(
      'Could not determine the sample ID and/or the dummy sample ID.'
    );
  }
}
