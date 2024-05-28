/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { QuestionnaireQuestionTextComponent } from './questionnaire-question-text/questionnaire-question-text.component';

import { QuestionnairePageRoutingModule } from './questionnaire-routing.module';
import { QuestionnaireListPage } from './questionnaire-list/questionnaire-list.page';
import { QuestionnaireInstancesListComponent } from './questionnaire-instances-list/questionnaire-instances-list.component';
import { QuestionnaireProgressBarComponent } from './questionnaire-progress-bar/questionnaire-progress-bar.component';
import { QuestionnaireDetailPage } from './questionnaire-detail/questionnaire-detail.page';
import { SharedModule } from '../shared/shared.module';
import { QuestionnaireAnswerSingleSelectComponent } from './questionnaire-answer-single-select/questionnaire-answer-single-select.component';
import { QuestionnaireAnswerInputTextComponent } from './questionnaire-answer-input-text/questionnaire-answer-input-text.component';
import { QuestionnaireAnswerCheckboxComponent } from './questionnaire-answer-checkbox/questionnaire-answer-checkbox.component';
import { QuestionnaireAnswerInputNumberComponent } from './questionnaire-answer-input-number/questionnaire-answer-input-number.component';
import { QuestionnaireAnswerInputDatetimeComponent } from './questionnaire-answer-input-datetime/questionnaire-answer-input-datetime.component';
import { QuestionnaireRestrictionDaysAsDatePipe } from './questionnaire-detail/questionnaire-restriction-days-as-date.pipe';
import { QuestionnaireFillDatePlaceholdersPipe } from './questionnaire-detail/questionnaire-fill-date-placeholders.pipe';
import { QuestionnaireAnswerSampleComponent } from './questionnaire-answer-sample/questionnaire-answer-sample.component';
import { QuestionnaireAnswerPznComponent } from './questionnaire-answer-pzn/questionnaire-answer-pzn.component';
import { QuestionnaireAnswerImageComponent } from './questionnaire-answer-image/questionnaire-answer-image.component';
import { QuestionnaireAnswerTimestampComponent } from './questionnaire-answer-timestamp/questionnaire-answer-timestamp.component';
import { QuestionnaireAnswerErrorComponent } from './questionnaire-answer-error/questionnaire-answer-error.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    QuestionnairePageRoutingModule,
    SharedModule,
    MarkdownModule.forChild(),
    ReactiveFormsModule,
    ScrollingModule,
  ],
  declarations: [
    QuestionnaireListPage,
    QuestionnaireDetailPage,
    QuestionnaireInstancesListComponent,
    QuestionnaireProgressBarComponent,
    QuestionnaireAnswerSingleSelectComponent,
    QuestionnaireAnswerInputTextComponent,
    QuestionnaireAnswerInputNumberComponent,
    QuestionnaireAnswerCheckboxComponent,
    QuestionnaireAnswerInputDatetimeComponent,
    QuestionnaireAnswerSampleComponent,
    QuestionnaireAnswerPznComponent,
    QuestionnaireAnswerImageComponent,
    QuestionnaireAnswerTimestampComponent,
    QuestionnaireRestrictionDaysAsDatePipe,
    QuestionnaireFillDatePlaceholdersPipe,
    QuestionnaireAnswerErrorComponent,
    QuestionnaireQuestionTextComponent,
  ],
})
export class QuestionnaireModule {}
