/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Directive } from '@angular/core';
import {
  FeedbackStatisticConfigurationMetaDataDto,
  SpecificFeedbackStatisticConfigurationDto,
} from './feedback-statistic-configuration/feedback-statistic-configuration.model';
import { FeedbackStatisticConfigurationMetaDataForm } from './feedback-statistic-meta-data/feedback-statistic-meta-data-form.service';
import { FeedbackStatisticConfigurationForm } from './feedback-statistic-configuration/feedback-statistic-configuration-form';

@Directive()
export abstract class AbstractFeedbackStatisticConfigurationComponent<
  Form extends FeedbackStatisticConfigurationForm,
  Dto extends Form extends FeedbackStatisticConfigurationMetaDataForm
    ? FeedbackStatisticConfigurationMetaDataDto
    : SpecificFeedbackStatisticConfigurationDto
> {
  public abstract readonly form: Form;

  public abstract getConfiguration(): Dto;

  public abstract setConfiguration(configuration: Dto): void;
}
