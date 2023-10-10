/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticConfigurationMetaDataForm } from '../feedback-statistic-meta-data/feedback-statistic-meta-data-form.service';
import { RelativeFrequencyTimeSeriesConfigurationForm } from '../relative-frequency-time-series-configuration/relative-frequency-time-series-configuration-form.service';

export type SpecificFeedbackStatisticForm =
  RelativeFrequencyTimeSeriesConfigurationForm;

export type FeedbackStatisticConfigurationForm =
  | FeedbackStatisticConfigurationMetaDataForm
  | SpecificFeedbackStatisticForm;
