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
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingSpinnerModule } from '../../features/loading-spinner/loading-spinner.module';
import { RelativeFrequencyTimeSeriesConfigurationComponent } from './relative-frequency-time-series-configuration/relative-frequency-time-series-configuration.component';
import { FeedbackStatisticMetaDataComponent } from './feedback-statistic-meta-data/feedback-statistic-meta-data.component';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { StudySelectComponent } from '../../features/study-select/study-select.component';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatIconModule } from '@angular/material/icon';
import { HintComponent } from '../../features/hint/hint.component';
import { TimeSeriesItemComponent } from './time-series-item/time-series-item.component';
import { NgLetDirective } from '../../_directives/ng-let.directive';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectSearchModule } from '../../features/mat-select-search/mat-select-search.module';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { ChartsModule } from '@pia-system/charts';
import { FeedbackStatisticComponent } from './feedback-statistic/feedback-statistic.component';
import { MarkdownModule } from 'ngx-markdown';
import { MatSliderModule } from '@angular/material/slider';
import { FeedbackStatisticListProbandComponent } from './feedback-statistic-list-proband/feedback-statistic-list-proband.component';
import { FeedbackStatisticListComponent } from './feedback-statistic-list/feedback-statistic-list.component';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import { MatLegacyDialogModule } from '@angular/material/legacy-dialog';
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
    MatLegacyDialogModule,
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
