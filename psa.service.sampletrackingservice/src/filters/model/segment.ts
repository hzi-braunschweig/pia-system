/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SegmentElement } from './segmentElement';

export interface Segment {
  content: string;
  type: string;
  element?: SegmentElement;
}
