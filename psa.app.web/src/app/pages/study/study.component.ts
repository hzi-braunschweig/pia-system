/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { Study } from '../../psa.app.core/models/study';
import { from, merge, mergeMap, Observable, of, Subject, tap } from 'rxjs';
import { filter, first, map, pluck } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { StudyChangeService } from '../studies/study-change.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import {
  DialogMarkdownEditorComponent,
  DialogMarkdownEditorData,
} from '../../dialogs/dialog-markdown-editor/dialog-markdown-editor.component';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { AlertService } from '../../_services/alert.service';
import {
  DialogMarkdownMailEditorComponent,
  DialogMarkdownMailEditorData,
  DialogMarkdownMailEditorResponse,
} from '../../dialogs/dialog-markdown-mail-editor/dialog-markdown-mail-editor.component';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { DialogMarkdownLabresultEditorComponent } from 'src/app/dialogs/dialog-markdown-labresult-editor/dialog-markdown-labresult-editor.component';

@Component({
  selector: 'app-home-professional',
  templateUrl: './study.component.html',
})
export class StudyComponent {
  public selectedStudyName;

  public selectedStudy$: Observable<Study>;

  private externallyUpdatedStudy: Subject<string> = new Subject();

  constructor(
    private readonly userService: UserService,
    private readonly sampleTrackingService: SampleTrackingService,
    private readonly studyChangeService: StudyChangeService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService
  ) {
    this.selectedStudy$ = this.getSelectedStudyObservable();

    if (this.router.url.includes('pendingstudychange')) {
      this.showPendingStudyChangeReview();
    }
  }

  public changeSelectedStudy(studyName: string): void {
    this.router.navigate(['study', studyName]);
  }

  public editStudy(study: Study): void {
    const updatedStudy = this.selectedStudyName;
    this.studyChangeService
      .requestStudyChange(study)
      .subscribe(() => this.externallyUpdatedStudy.next(updatedStudy));
  }

  public cancelPendingStudyChange(pendingStudyChangeId: number): void {
    const updatedStudy = this.selectedStudyName;
    this.studyChangeService
      .cancelPendingStudyChange(pendingStudyChangeId)
      .subscribe(() => this.externallyUpdatedStudy.next(updatedStudy));
  }

  public editWelcomeMail(): void {
    from(this.userService.getStudyWelcomeMail(this.selectedStudyName))
      .pipe(
        mergeMap((welcomeMail) =>
          this.dialog
            .open<
              DialogMarkdownMailEditorComponent,
              DialogMarkdownMailEditorData,
              DialogMarkdownMailEditorResponse
            >(DialogMarkdownMailEditorComponent, {
              width: '1000px',
              data: {
                dialogTitle: 'STUDY.EDIT_WELCOME_MAIL',
                initialSubject: welcomeMail.subject,
                initialText: welcomeMail.markdownText,
              },
            })
            .afterClosed()
        ),
        filter(
          (updatedText) => updatedText !== null && updatedText !== undefined
        ),
        mergeMap((updatedMail) =>
          from(
            this.userService.putStudyWelcomeMail(
              this.selectedStudyName,
              updatedMail
            )
          )
        )
      )
      .subscribe({
        next: () => {
          this.dialog.open(DialogPopUpComponent, {
            width: '300px',
            data: {
              content: 'STUDY.WELCOME_MAIL_PUBLISHED_SUCCESSFULLY',
              isSuccess: true,
            },
          });
        },
        error: (err) => this.alertService.errorObject(err),
      });
  }

  public editWelcomeText(): void {
    from(this.userService.getStudyWelcomeText(this.selectedStudyName))
      .pipe(
        map((result) => result?.welcome_text ?? ''),
        mergeMap((welcomeText) =>
          this.dialog
            .open<
              DialogMarkdownEditorComponent,
              DialogMarkdownEditorData,
              string
            >(DialogMarkdownEditorComponent, {
              width: '1000px',
              data: {
                dialogTitle: 'STUDY.EDIT_WELCOME_TEXT',
                initialText: welcomeText,
              },
            })
            .afterClosed()
        ),
        filter(
          (updatedText) => updatedText !== null && updatedText !== undefined
        ),
        mergeMap((updatedText) =>
          from(
            this.userService.putStudyWelcomeText(
              this.selectedStudyName,
              updatedText
            )
          )
        )
      )
      .subscribe({
        next: () => {
          this.dialog.open(DialogPopUpComponent, {
            width: '300px',
            data: {
              content: 'STUDY.WELCOME_TEXT_PUBLISHED_SUCCESSFULLY',
              isSuccess: true,
            },
          });
        },
        error: (err) => this.alertService.errorObject(err),
      });
  }

  public editLabResultTemplateText(): void {
    from(
      this.sampleTrackingService.getLabResultTemplate(this.selectedStudyName)
    )
      .pipe(
        map((result) => result?.markdownText ?? ''),
        mergeMap((markdownText) =>
          this.dialog
            .open<
              DialogMarkdownLabresultEditorComponent,
              DialogMarkdownEditorData,
              string
            >(DialogMarkdownLabresultEditorComponent, {
              width: '1300px',
              data: {
                dialogTitle: 'STUDY.LABRESULT_TEMPLATE.EDIT',
                initialText: markdownText,
              },
            })
            .afterClosed()
        ),
        filter(
          (markdownText) => markdownText !== null && markdownText !== undefined
        ),
        mergeMap((markdownText) =>
          from(
            this.sampleTrackingService.updateLabResultTemplate(
              this.selectedStudyName,
              { markdownText }
            )
          )
        )
      )
      .subscribe({
        next: () => {
          this.dialog.open(DialogPopUpComponent, {
            width: '300px',
            data: {
              content: 'STUDY.LABRESULT_TEMPLATE_TEXT_PUBLISHED_SUCCESSFULLY',
              isSuccess: true,
            },
          });
        },
        error: (err) => this.alertService.errorObject(err),
      });
  }

  private getSelectedStudyObservable(): Observable<Study> {
    return merge(
      this.activatedRoute.params.pipe(
        pluck('studyName'),
        filter(Boolean),
        tap((studyName) => (this.selectedStudyName = studyName))
      ),
      this.externallyUpdatedStudy
        .asObservable()
        .pipe(filter((updatedStudy) => updatedStudy === this.selectedStudyName))
    ).pipe(
      filter(Boolean),
      mergeMap((studyName) =>
        merge(of(null), from(this.userService.getStudy(studyName)))
      )
    );
  }

  private showPendingStudyChangeReview() {
    this.selectedStudy$
      .pipe(
        filter(Boolean),
        first(),
        mergeMap((study) =>
          this.studyChangeService
            .reviewPendingStudyChange(study)
            .pipe(map(() => study.name))
        )
      )
      .subscribe((updatedStudy) =>
        this.externallyUpdatedStudy.next(updatedStudy)
      );
  }
}
