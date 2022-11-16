/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { StudyComponent } from './study.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { StudyChangeService } from '../studies/study-change.service';
import { MockComponent, MockProvider } from 'ng-mocks';
import { createStudy } from '../../psa.app.core/models/instance.helper.spec';
import { of, Subject } from 'rxjs';
import { NgLetDirective } from '../../_directives/ng-let.directive';
import { LoadingSpinnerComponent } from '../../features/loading-spinner/loading-spinner.component';
import { StudySelectComponent } from '../../features/study-select/study-select.component';
import { StudyProfessionalSummaryComponent } from './study-professional-summary/study-professional-summary.component';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from '../../_services/alert.service';
import { StudyWelcomeText } from '../../psa.app.core/models/studyWelcomeText';
import { DialogMarkdownEditorComponent } from '../../dialogs/dialog-markdown-editor/dialog-markdown-editor.component';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';

describe('HomeProfessionalComponent', () => {
  let component: StudyComponent;
  let fixture: ComponentFixture<StudyComponent>;

  let userService: SpyObj<UserService>;
  let studyChangeService: SpyObj<StudyChangeService>;
  let activatedRoute: SpyObj<ActivatedRoute>;
  let router: SpyObj<Router>;
  let dialog: SpyObj<MatDialog>;
  let alertService: SpyObj<AlertService>;

  let studyChangeSubject: Subject<true>;
  let afterClosedSubject: Subject<string>;

  beforeEach(async () => {
    userService = createSpyObj<UserService>('UserService', [
      'getStudy',
      'getStudyWelcomeText',
      'putStudyWelcomeText',
    ]);
    userService.getStudy.and.resolveTo(createStudy());
    userService.getStudyWelcomeText.and.resolveTo({
      welcome_text: 'some existing text',
    } as StudyWelcomeText);
    userService.putStudyWelcomeText.and.resolveTo();

    studyChangeSubject = new Subject<true>();
    studyChangeService = createSpyObj<StudyChangeService>(
      'StudyChangeService',
      [
        'requestStudyChange',
        'cancelPendingStudyChange',
        'reviewPendingStudyChange',
      ]
    );
    studyChangeService.requestStudyChange.and.returnValue(
      studyChangeSubject.asObservable()
    );
    studyChangeService.cancelPendingStudyChange.and.returnValue(
      studyChangeSubject.asObservable()
    );
    studyChangeService.reviewPendingStudyChange.and.returnValue(
      studyChangeSubject.asObservable()
    );

    activatedRoute = createSpyObj<ActivatedRoute>('ActivatedRoute', [], {
      params: of({ studyName: 'Teststudy' }),
    });
    router = createSpyObj<Router>('Router', ['navigate'], {
      url: '/some/url',
    });

    afterClosedSubject = new Subject<string>();
    dialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<any>);

    alertService = createSpyObj<AlertService>('AlertService', ['errorObject']);

    await TestBed.configureTestingModule({
      imports: [MatCardModule, FormsModule],
      declarations: [
        StudyComponent,
        NgLetDirective,
        MockComponent(LoadingSpinnerComponent),
        MockComponent(StudySelectComponent),
        MockComponent(StudyProfessionalSummaryComponent),
      ],
      providers: [
        MockProvider(UserService, userService),
        MockProvider(StudyChangeService, studyChangeService),
        MockProvider(ActivatedRoute, activatedRoute),
        MockProvider(Router, router),
        MockProvider(MatDialog, dialog),
        MockProvider(AlertService, alertService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should preselect an study from params', () => {
    expect(userService.getStudy).toHaveBeenCalledWith('Teststudy');
    expect(component.selectedStudyName).toEqual('Teststudy');
  });

  describe('changeSelectedStudy()', () => {
    it('should navigate to selected study', () => {
      // Arrange

      // Act
      component.changeSelectedStudy('Teststudy2');

      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['study', 'Teststudy2']);
    });
  });

  describe('editStudy()', () => {
    it('should request a study change', () => {
      // Arrange
      const study = createStudy({ name: 'Teststudy' });

      // Act
      component.editStudy(study);

      // Assert
      expect(studyChangeService.requestStudyChange).toHaveBeenCalledWith(study);
    });

    it('should update if a study changed', fakeAsync(() => {
      // Arrange
      const study = createStudy({ name: 'Teststudy' });

      // Act
      component.editStudy(study);
      studyChangeSubject.next(true);
      tick();

      // Assert
      expect(userService.getStudy).toHaveBeenCalledTimes(2);
      expect(userService.getStudy).toHaveBeenCalledWith('Teststudy');
    }));
  });

  describe('cancelPendingStudyChange', () => {
    it('should cancel a pending study change', () => {
      // Arrange

      // Act
      component.cancelPendingStudyChange(1234);

      // Assert
      expect(studyChangeService.cancelPendingStudyChange).toHaveBeenCalledWith(
        1234
      );
    });

    it('should update if a pending study change was cancelled', fakeAsync(() => {
      // Arrange

      // Act
      component.cancelPendingStudyChange(1234);
      studyChangeSubject.next(true);
      tick();

      // Assert
      expect(userService.getStudy).toHaveBeenCalledTimes(2);
      expect(userService.getStudy).toHaveBeenCalledWith('Teststudy');
    }));
  });

  describe('editWelcomeText()', () => {
    it('should open the editor dialog with the current welcome text', fakeAsync(() => {
      // Arrange

      // Act
      component.editWelcomeText();
      tick();

      // Assert
      expect(userService.getStudyWelcomeText).toHaveBeenCalledOnceWith(
        'Teststudy'
      );
      expect(dialog.open).toHaveBeenCalledOnceWith(
        DialogMarkdownEditorComponent,
        {
          width: '1000px',
          data: {
            dialogTitle: 'STUDY.EDIT_WELCOME_TEXT',
            initialText: 'some existing text',
          },
        }
      );
    }));

    it('should update the welcome text if a change was returned', fakeAsync(() => {
      // Arrange

      // Act
      component.editWelcomeText();
      tick();
      afterClosedSubject.next('some new text');
      tick();

      // Assert
      expect(userService.putStudyWelcomeText).toHaveBeenCalledOnceWith(
        'Teststudy',
        'some new text'
      );
    }));

    it('should show a success dialog after updating the text', fakeAsync(() => {
      // Arrange

      // Act
      component.editWelcomeText();
      tick();
      afterClosedSubject.next('some new text');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDY.WELCOME_TEXT_PUBLISHED_SUCCESSFULLY',
          isSuccess: true,
        },
      });
    }));

    it('should show an error alert if an error occurs', fakeAsync(() => {
      // Arrange
      userService.putStudyWelcomeText.and.rejectWith('some error');

      // Act
      component.editWelcomeText();
      tick();
      afterClosedSubject.error(new Error('some new text'));
      tick();

      // Assert
      expect(alertService.errorObject).toHaveBeenCalledOnceWith(
        new Error('some new text')
      );
    }));
  });
});
