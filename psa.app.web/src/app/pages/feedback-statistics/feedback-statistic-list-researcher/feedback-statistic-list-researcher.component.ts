/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import {
  finalize,
  merge,
  mergeMap,
  NEVER,
  Observable,
  of,
  tap,
  timer,
} from 'rxjs';
import { FeedbackStatisticDto } from '@pia-system/charts';
import { FeedbackStatisticsService } from '../feedback-statistics.service';
import { filter } from 'rxjs/internal/operators/filter';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { TranslateService } from '@ngx-translate/core';
import { MatLegacyDialog } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-feedback-statistic-list-researcher',
  templateUrl: './feedback-statistic-list-researcher.component.html',
})
export class FeedbackStatisticListResearcherComponent {
  public isLoading = false;

  public selectedStudy = new FormControl<string>(null);

  public feedbackStatistics$: Observable<FeedbackStatisticDto[]>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly feedbackStatisticsService: FeedbackStatisticsService,
    private readonly router: Router,
    private readonly dialog: MatLegacyDialog,
    private readonly translate: TranslateService
  ) {
    this.activatedRoute.params
      .pipe(filter((params) => 'studyName' in params))
      .subscribe((params) => {
        this.isLoading = true;
        this.feedbackStatistics$ =
          this.getFeedbackStatisticsForResearcherWithUpdate(params.studyName);
        this.selectedStudy.setValue(params.studyName);
      });
    this.selectedStudy.valueChanges.subscribe((studyName) => {
      this.router.navigate(['feedback-statistics', 'study', studyName]);
    });
  }

  public deleteFeedbackStatistic(configurationId: number): void {
    this.dialog
      .open(DialogDeleteComponent, {
        width: '500px',
        data: {
          data: this.translate.instant(
            'FEEDBACK_STATISTICS.DELETE_CONFIRMATION_TEXT'
          ),
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(() => (this.isLoading = true)),
        mergeMap(() =>
          this.feedbackStatisticsService.deleteFeedbackStatisticConfiguration(
            configurationId,
            this.selectedStudy.value
          )
        ),
        mergeMap(
          () =>
            (this.feedbackStatistics$ =
              this.getFeedbackStatisticsForResearcherWithUpdate(
                this.selectedStudy.value
              ))
        ),
        finalize(() => (this.isLoading = false))
      )
      .subscribe();
  }

  /**
   * Returns the feedback statistics for the given study name and updates the
   * list every 3 seconds if there are pending feedback statistics.
   */
  private getFeedbackStatisticsForResearcherWithUpdate(
    studyName
  ): Observable<FeedbackStatisticDto[]> {
    const updateDelay = 3000;
    return this.feedbackStatisticsService
      .getFeedbackStatisticsForResearcher(studyName)
      .pipe(
        finalize(() => (this.isLoading = false)),
        mergeMap((feedbackStatistics) => {
          return merge(
            of(feedbackStatistics),
            this.hasPendingFeedbackStatistics(feedbackStatistics)
              ? timer(updateDelay).pipe(
                  mergeMap(() =>
                    this.getFeedbackStatisticsForResearcherWithUpdate(studyName)
                  )
                )
              : NEVER
          );
        })
      );
  }

  private hasPendingFeedbackStatistics(
    feedbackStatistics: FeedbackStatisticDto[]
  ): boolean {
    return feedbackStatistics.some(
      (statistic) => statistic.status === 'pending'
    );
  }
}
