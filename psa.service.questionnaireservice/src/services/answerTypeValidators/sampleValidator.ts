/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../models/answer';
import { isSampleDto } from '../../models/sample';
import { SampleService } from '../sampleService';

export default function sampleValidator(
  value: AnswerValue,
  prefix: string | null,
  suffixLength: number | null,
  studyHasRnaSamples: boolean
): string | null {
  if (!isSampleDto(value)) {
    return 'expected: SampleDto';
  }

  if (studyHasRnaSamples && !value.dummySampleId) {
    return 'expected: SampleDto.sampleDummyId';
  }

  if (!SampleService.isSampleDtoValid(value, prefix, suffixLength)) {
    return (
      'expected: Sample IDs in SampleDto to match ' +
      SampleService.createSampleIdRegexPattern(prefix, suffixLength)
    );
  }

  return null;
}
