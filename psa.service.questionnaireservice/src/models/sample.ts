/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SampleId } from './customTypes';

export interface NasalSwapSample {
  id: string;
  user_id: string;
  ids: string | null;
  order_id: number;
  dummy_sample_id: string;
  performing_doctor: string;
  date_of_sampling: string;
  remark: string;
  status: string;
  study_status: string;
  new_samples_sent: boolean;
}

export interface BloodSample {
  id: number;
  user_id: string;
  ids: string | null;
  sample_id: string;
  blood_sample_carried_out: boolean;
  remark: string;
}

/**
 * Contains a sample ID and an optional dummy ID for validation.
 * Answer for type of "Sample".
 *
 * @example {
 *   sampleId: "PREFIX-013456";
 *   dummySampleId: "PREFIX-003456";
 * }
 */
export interface SampleDto {
  sampleId: SampleId;
  dummySampleId?: SampleId;
}

export function isSampleDto(value: unknown): value is SampleDto {
  return value !== null && typeof value === 'object' && 'sampleId' in value;
}

export type SampleIdTuple = [SampleId] | [SampleId, SampleId];

export function isArraySampleIdTuple(array: unknown[]): array is SampleIdTuple {
  return (
    array.length > 0 &&
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    array.length <= 2 &&
    array.every((v) => typeof v === 'string')
  );
}
