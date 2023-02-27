/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { DeleteAccountModalService } from './delete-account-modal.service';
import { DeletionType } from './deletion-type.enum';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { QuestionnaireClientService } from '../../questionnaire/questionnaire-client.service';
import { Study } from '../../questionnaire/questionnaire.model';
import { CannotDetermineDeletionTypeError } from './cannot-determine-deletion-type.error';
import { KeepStudyAnswersModalComponent } from '../components/keep-study-answers-modal/keep-study-answers-modal.component';
import { DeleteAccountModalComponent } from '../components/delete-account-modal/delete-account-modal.component';
import { CurrentUser } from '../../auth/current-user.service';

describe('DeleteAccountModalService', () => {
  let service: DeleteAccountModalService;
  let currentUser: CurrentUser;
  let questionnaireClientService: QuestionnaireClientService;
  let modalController: ModalController;

  function mockGetStudy(study: Partial<Study>) {
    spyOn(questionnaireClientService, 'getStudy').and.returnValue(
      Promise.resolve(study as Study)
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule, HttpClientTestingModule],
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
    let modalControllerCreateSpy: jasmine.Spy;
    let mockModal: Partial<HTMLIonModalElement>;

    beforeEach(() => {
      mockModal = {
        present: jasmine.createSpy(),
      };
      modalControllerCreateSpy = spyOn(modalController, 'create');
      modalControllerCreateSpy.and.returnValue(
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
      (
        { expectation, partialOpposition, keepStudyAnswers, expectedModal },
        index
      ) => {
        it(`should ${expectation}`, async () => {
          mockGetStudy({
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

          expect(modalControllerCreateSpy).toHaveBeenCalledOnceWith({
            component: expectedModal,
          });

          expect(mockModal.present).toHaveBeenCalled();
        });
      }
    );
  });
});
