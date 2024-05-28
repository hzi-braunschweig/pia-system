/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * The pseudonym is the unique identifier of a participant.
 * It consists of a prefix and a suffix. The prefix maps
 * to exactly one study. The suffix consists only of integers
 * and is unique within the study. There is no specific
 * limitation for the length of the prefix and the suffix.
 *
 * @pattern ^[a-z]+-[0-9]+$
 * @example "abcd-1234"
 */
export type Pseudonym = string;
/**
 * ISO 8061 Date string
 *
 * @example "2024-02-06"
 */
export type IsoDateString = string;
/**
 * ISO 8061 timestamp string
 * @example "2024-02-06T12:12:12.000Z"
 */
export type IsoTimestampString = string;
/**
 * Sample ID, consisting of an optional prefix and number sequence.
 * The prefix and length of the number sequence is defined by the
 * corresponding study.
 *
 * @pattern ^([A-Z]+-)?[0-9]+$
 * @example "PREFIX-012345678"
 */
export type SampleId = string;
