/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackStatisticConfigurationComponent } from './feedback-statistic-configuration/feedback-statistic-configuration.component';
import { FeedbackStatisticListResearcherComponent } from './feedback-statistic-list-researcher/feedback-statistic-list-researcher.component';
import { FeedbackStatisticsRoutingModule } from './feedback-statistics-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingSpinnerModule } from '../../features/loading-spinner/loading-spinner.module';
import { RelativeFrequencyTimeSeriesConfigurationComponent } from './relative-frequency-time-series-configuration/relative-frequency-time-series-configuration.component';
import { FeedbackStatisticMetaDataComponent } from './feedback-statistic-meta-data/feedback-statistic-meta-data.component';
import { MatCardModule } from '@angular/material/card';
import { StudySelectComponent } from '../../features/study-select/study-select.component';
import { MatSelectModule } from '@angular/material/select';
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { HintComponent } from '../../features/hint/hint.component';
import { TimeSeriesItemComponent } from './time-series-item/time-series-item.component';
import { NgLetDirective } from '../../_directives/ng-let.directive';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectSearchModule } from '../../features/mat-select-search/mat-select-search.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ChartsModule } from '@pia-system/charts';
import { FeedbackStatisticComponent } from './feedback-statistic/feedback-statistic.component';
import { MarkdownModule } from 'ngx-markdown';
import { MatSliderModule } from '@angular/material/slider';
import { FeedbackStatisticListProbandComponent } from './feedback-statistic-list-proband/feedback-statistic-list-proband.component';
import { FeedbackStatisticListComponent } from './feedback-statistic-list/feedback-statistic-list.component';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogInfoComponent } from '../../_helpers/dialog-info';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    FeedbackStatisticConfigurationComponent,
    FeedbackStatisticListResearcherComponent,
    RelativeFrequencyTimeSeriesConfigurationComponent,
    FeedbackStatisticMetaDataComponent,
    TimeSeriesItemComponent,
    FeedbackStatisticComponent,
    FeedbackStatisticListProbandComponent,
    FeedbackStatisticListComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatGridListModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSelectSearchModule,
    MatDialogModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MarkdownModule,
    LoadingSpinnerModule,
    StudySelectComponent,
    MarkdownEditorComponent,
    HintComponent,
    NgLetDirective,
    ChartsModule.forChild(),
    FeedbackStatisticsRoutingModule,
    DialogDeleteComponent,
    DialogInfoComponent,
  ],
})
export class FeedbackStatisticsModule {}
