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
 * @pattern ^[a-z0-9]+-[0-9]+$
 * @example "abcd12-1234"
 */
export type Pseudonym = string;
