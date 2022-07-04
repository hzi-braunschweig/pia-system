/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { KeepStudyAnswersModalComponent } from './keep-study-answers-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';

describe('KeepStudyAnswersModalComponent', () => {
  let component: KeepStudyAnswersModalComponent;
  let fixture: ComponentFixture<KeepStudyAnswersModalComponent>;
  let deleteAccountModalService: DeleteAccountModalService;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [KeepStudyAnswersModalComponent, MockPipe(TranslatePipe)],
        imports: [
          IonicModule.forRoot(),
          HttpClientTestingModule,
          TranslateModule,
        ],
      }).compileComponents();

      deleteAccountModalService = TestBed.inject(DeleteAccountModalService);
      fixture = TestBed.createComponent(KeepStudyAnswersModalComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

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
