/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { QuestionnaireAnswerMultiSelectComponent } from './questionnaire-answer-multi-select/questionnaire-answer-multi-select.component';
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
import {
  IonItem,
  IonText,
  IonLabel,
  IonThumbnail,
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonImg,
  IonIcon,
  IonInput,
  IonDatetime,
  IonChip,
  IonList,
  IonCheckbox,
  IonRadioGroup,
  IonRadio,
  IonProgressBar,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonFab,
  IonFabButton,
  IonItemGroup,
  IonItemDivider,
  IonBadge,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
} from '@ionic/angular/standalone';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule.forChild(),
    QuestionnairePageRoutingModule,
    SharedModule,
    MarkdownModule.forChild(),
    ReactiveFormsModule,
    ScrollingModule,
    IonItem,
    IonText,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonImg,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonModal,
    IonContent,
    IonDatetime,
    IonItem,
    IonLabel,
    IonInput,
    IonItem,
    IonLabel,
    IonInput,
    IonItem,
    IonLabel,
    IonInput,
    IonChip,
    IonIcon,
    IonList,
    IonCheckbox,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonItem,
    IonText,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonList,
    IonButton,
    IonIcon,
    IonLabel,
    IonText,
    IonItem,
    IonThumbnail,
    IonImg,
    IonFab,
    IonFabButton,
    IonList,
    IonItemGroup,
    IonItem,
    IonIcon,
    IonLabel,
    IonItemDivider,
    IonBadge,
    IonNote,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItemGroup,
    IonItem,
    IonSkeletonText,
    IonProgressBar,
    IonNote,
    IonIcon,
    QuestionnaireListPage,
    QuestionnaireDetailPage,
    QuestionnaireInstancesListComponent,
    QuestionnaireProgressBarComponent,
    QuestionnaireAnswerSingleSelectComponent,
    QuestionnaireAnswerInputTextComponent,
    QuestionnaireAnswerInputNumberComponent,
    QuestionnaireAnswerMultiSelectComponent,
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
