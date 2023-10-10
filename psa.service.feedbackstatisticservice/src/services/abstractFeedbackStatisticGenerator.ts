/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticData } from '../entities/feedbackStatistic';

export abstract class AbstractFeedbackStatisticGenerator<
  T extends FeedbackStatisticData
> {
  public abstract generateData(configurationId: number): Promise<T>;
}
