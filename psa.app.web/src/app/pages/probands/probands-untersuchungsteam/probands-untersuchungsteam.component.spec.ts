/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ProbandsUntersuchungsteamComponent } from './probands-untersuchungsteam.component';
import { Router } from '@angular/router';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { By } from '@angular/platform-browser';
import { MockBuilder, MockRender } from 'ng-mocks';
import { Subject } from 'rxjs';
import { AppModule } from '../../../app.module';
import { ProbandsListModule } from '../../../features/probands-list/probands-list.module';
import { DialogNewProbandComponent } from '../../../dialogs/new-proband-dialog/new-proband-dialog';
import SpyObj = jasmine.SpyObj;

describe('ProbandsUntersuchungsteamComponent', () => {
  let component: ProbandsUntersuchungsteamComponent;
  let fixture: ComponentFixture<ProbandsUntersuchungsteamComponent>;

  let router: SpyObj<Router>;
  let dialog: SpyObj<MatDialog>;
  let afterClosedSubject: Subject<string>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    afterClosedSubject = new Subject();
    dialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<DialogNewProbandComponent>);

    await MockBuilder(ProbandsUntersuchungsteamComponent, AppModule)
      .mock(ProbandsListModule)
      .mock(Router, router)
      .mock(MatDialog, dialog);

    fixture = MockRender(ProbandsUntersuchungsteamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('page header buttons', () => {
    it('should present a button to open a dialog for adding new ids', fakeAsync(() => {
      clickButton('[unit-create-ids]');
      expect(dialog.open).toHaveBeenCalledTimes(1);
      afterClosedSubject.next('testuser');
      tick();
      expect(component.probandsList.fetchProbands).toHaveBeenCalledTimes(1);
    }));

    it('should present a button to navigate to proband creation', fakeAsync(() => {
      clickButton('[unit-create-proband]');
      expect(dialog.open).toHaveBeenCalledTimes(1);
      afterClosedSubject.next('testuser');
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/probands/', 'testuser']);
    }));
  });

  describe('probands list entry actions', () => {
    it('should present a button to view proband details', () => {
      clickButton('[unit-view-labresults-for-proband]');
      expect(router.navigate).toHaveBeenCalledWith(['/probands/', undefined]);
    });

    it('should present a button to add pseudonyms', fakeAsync(() => {
      clickButton('[unit-view-labresults-add-pseudonym]');
      expect(dialog.open).toHaveBeenCalledTimes(1);
      afterClosedSubject.next('testuser');
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/probands/', 'testuser']);
    }));

    it('should present a button to view questionnaires', () => {
      clickButton('[unit-view-questionnaires]');
      expect(router.navigate).toHaveBeenCalledWith([
        'studies/:studyName/probands',
        undefined,
        'questionnaireInstances',
      ]);
    });
  });

  function clickButton(selector): void {
    const button = fixture.debugElement.query(By.css(selector));
    expect(button).toBeDefined();
    button.nativeElement.click();
  }
});
