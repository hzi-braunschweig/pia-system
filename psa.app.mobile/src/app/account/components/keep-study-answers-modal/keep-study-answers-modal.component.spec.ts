/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { KeepStudyAnswersModalComponent } from './keep-study-answers-modal.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ModalController } from '@ionic/angular/standalone';
import { MockProvider } from 'ng-mocks';

describe('KeepStudyAnswersModalComponent', () => {
  let component: KeepStudyAnswersModalComponent;
  let fixture: ComponentFixture<KeepStudyAnswersModalComponent>;
  let deleteAccountModalService: DeleteAccountModalService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), KeepStudyAnswersModalComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        MockProvider(ModalController),
      ],
    }).compileComponents();

    deleteAccountModalService = TestBed.inject(DeleteAccountModalService);
    fixture = TestBed.createComponent(KeepStudyAnswersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('allow/deny', () => {
    let dismissSpy: jasmine.Spy;
    let allowKeepStudyAnswersSpy: jasmine.Spy;
    let denyKeepStudyAnswersSpy: jasmine.Spy;
    let showDeleteAccountModalSpy: jasmine.Spy;

    beforeEach(() => {
      dismissSpy = spyOn(component, 'dismiss');
      allowKeepStudyAnswersSpy = spyOn(
        deleteAccountModalService,
        'allowKeepStudyAnswers'
      );
      denyKeepStudyAnswersSpy = spyOn(
        deleteAccountModalService,
        'denyKeepStudyAnswers'
      );
      showDeleteAccountModalSpy = spyOn(
        deleteAccountModalService,
        'showDeleteAccountModal'
      );
    });

    it('should allow to keep study answers and show next modal', () => {
      component.allow();

      expect(dismissSpy).toHaveBeenCalled();
      expect(allowKeepStudyAnswersSpy).toHaveBeenCalled();
      expect(showDeleteAccountModalSpy).toHaveBeenCalled();
    });

    it('should deny to keep study answers and show next modal', () => {
      component.deny();

      expect(dismissSpy).toHaveBeenCalled();
      expect(denyKeepStudyAnswersSpy).toHaveBeenCalled();
      expect(showDeleteAccountModalSpy).toHaveBeenCalled();
    });
  });
});
