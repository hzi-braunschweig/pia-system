/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { DeleteAccountModalService } from './delete-account-modal.service';
import { DeletionType } from './deletion-type.enum';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { QuestionnaireClientService } from '../../questionnaire/questionnaire-client.service';
import { CannotDetermineDeletionTypeError } from './cannot-determine-deletion-type.error';
import { KeepStudyAnswersModalComponent } from '../components/keep-study-answers-modal/keep-study-answers-modal.component';
import { DeleteAccountModalComponent } from '../components/delete-account-modal/delete-account-modal.component';
import { CurrentUser } from '../../auth/current-user.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MockProvider } from 'ng-mocks';

describe('DeleteAccountModalService', () => {
  let service: DeleteAccountModalService;
  let currentUser: CurrentUser;
  let questionnaireClientService: QuestionnaireClientService;
  let modalController: ModalController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        MockProvider(ModalController),
        MockProvider(QuestionnaireClientService),
        MockProvider(CurrentUser),
      ],
    });
    service = TestBed.inject(DeleteAccountModalService);
    currentUser = TestBed.inject(CurrentUser);
    questionnaireClientService = TestBed.inject(QuestionnaireClientService);
    modalController = TestBed.inject(ModalController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSelectedDeletionType', () => {
    it('should throw an error when called before user allowed or denied keeping study answers', () => {
      expect(() => service.getSelectedDeletionType()).toThrow(
        new CannotDetermineDeletionTypeError()
      );
    });

    it(`should return correct type when keeping study answers was denied`, () => {
      service.denyKeepStudyAnswers();
      expect(service.getSelectedDeletionType()).toEqual(DeletionType.FULL);
    });

    it(`should return correct type when keeping study answers was allowed`, () => {
      service.allowKeepStudyAnswers();
      expect(service.getSelectedDeletionType()).toEqual(DeletionType.CONTACT);
    });
  });

  describe('showDeleteAccountModal', () => {
    let mockModal: Partial<HTMLIonModalElement>;

    beforeEach(() => {
      mockModal = {
        present: jasmine.createSpy(),
      };
      (modalController.create as jasmine.Spy).and.returnValue(
        Promise.resolve(mockModal as HTMLIonModalElement)
      );
      currentUser.study = 'foobar';
    });

    [
      {
        expectation: 'show modal for keeping study answers',
        partialOpposition: true,
        keepStudyAnswers: null,
        expectedModal: KeepStudyAnswersModalComponent,
      },
      {
        expectation: 'show delete modal if user allowed keeping answers',
        partialOpposition: true,
        keepStudyAnswers: true,
        expectedModal: DeleteAccountModalComponent,
      },
      {
        expectation: 'show delete modal if user denied keeping answers',
        partialOpposition: true,
        keepStudyAnswers: false,
        expectedModal: DeleteAccountModalComponent,
      },
      {
        expectation:
          'show delete modal when study does not allow partial opposition',
        partialOpposition: false,
        keepStudyAnswers: false,
        expectedModal: DeleteAccountModalComponent,
      },
    ].forEach(
      ({ expectation, partialOpposition, keepStudyAnswers, expectedModal }) => {
        it(`should ${expectation}`, async () => {
          (questionnaireClientService.getStudy as jasmine.Spy).and.returnValue({
            has_partial_opposition: partialOpposition,
          });

          switch (keepStudyAnswers) {
            case true:
              service.allowKeepStudyAnswers();
              break;
            case false:
              service.denyKeepStudyAnswers();
              break;
          }

          await service.showDeleteAccountModal();

          expect(
            modalController.create as jasmine.Spy
          ).toHaveBeenCalledOnceWith({
            component: expectedModal,
          });

          expect(mockModal.present).toHaveBeenCalled();
        });
      }
    );
  });
});
