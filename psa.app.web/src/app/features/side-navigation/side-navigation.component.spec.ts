/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { SideNavigationComponent } from './side-navigation.component';
import { Event, Router } from '@angular/router';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { Page, PageManager } from '../../_services/page-manager.service';
import { SelectedProbandInfoService } from '../../_services/selected-proband-info.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { User } from '../../psa.app.core/models/user';
import { SelectedProbandData } from '../../psa.app.core/models/selectedProbandData';
import { createUser } from '../../psa.app.core/models/instance.helper.spec';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogOkCancelComponent } from '../../_helpers/dialog-ok-cancel';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('SideNavigationComponent', () => {
  let fixture: ComponentFixture<SideNavigationComponent>;
  let component: SideNavigationComponent;
  let eventsMock: BehaviorSubject<Event>;
  let router: SpyObj<Router>;
  let currentUserObservableMock: BehaviorSubject<User>;
  let auth: SpyObj<AuthenticationManager>;
  let navPagesObservableMock: BehaviorSubject<Page[]>;
  let pageManager: SpyObj<PageManager>;
  let sideNavStateMock: BehaviorSubject<SelectedProbandData>;
  let selectedProbandInfoService: SpyObj<SelectedProbandInfoService>;

  beforeEach(async () => {
    // Provider and Services
    currentUserObservableMock = new BehaviorSubject<User>(
      createUser({ role: 'Untersuchungsteam' })
    );
    auth = createSpyObj<AuthenticationManager>(
      'AuthenticationManager',
      ['logout'],
      {
        currentUser$: currentUserObservableMock,
      }
    );

    navPagesObservableMock = new BehaviorSubject<Page[]>([
      { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
    ]);
    pageManager = createSpyObj<PageManager>('PageManager', undefined, {
      navPagesObservable: navPagesObservableMock,
    });

    eventsMock = new BehaviorSubject<Event>(null);
    router = createSpyObj<Router>('Router', ['navigate'], {
      events: eventsMock,
      url: '/home',
    });

    sideNavStateMock = new BehaviorSubject<SelectedProbandData>(null);
    selectedProbandInfoService = createSpyObj<SelectedProbandInfoService>(
      'SelectedProbandInfoService',
      undefined,
      {
        sideNavState$: sideNavStateMock,
      }
    );

    // Build Base Module
    await MockBuilder(SideNavigationComponent, AppModule)
      .mock(AuthenticationManager, auth)
      .mock(Router, router)
      .mock(PageManager, pageManager)
      .mock(SelectedProbandInfoService, selectedProbandInfoService);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SideNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }

  it('should create the component', fakeAsync(() => {
    createComponent();
    expect(component).toBeDefined();
  }));

  describe('logout()', () => {
    it('should close the side navigation', fakeAsync(() => {
      createComponent();
      const sidenav = createSpyObj<MatSidenav>('sidenav', ['close']);
      component.sidenav = sidenav;
      component.logout();
      tick();
      expect(sidenav.close).toHaveBeenCalled();
    }));

    it('should call logout and navigate to login page if it is not a proband', fakeAsync(() => {
      createComponent();
      component.logout();
      tick();
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledOnceWith(['login']);
    }));

    it('should open a confirm dialog if it is a proband', fakeAsync(() => {
      currentUserObservableMock.next(createUser({ role: 'Proband' }));
      const matDialog = TestBed.inject(MatDialog) as SpyObj<MatDialog>;
      const dialogRef = createSpyObj<MatDialogRef<DialogOkCancelComponent>>(
        'dialogRef',
        ['afterClosed']
      );
      const afterClosedSubject = new Subject();
      dialogRef.afterClosed.and.returnValue(afterClosedSubject);
      matDialog.open.and.returnValue(dialogRef);

      createComponent();
      component.logout();
      tick();
      expect(auth.logout).not.toHaveBeenCalled();
      expect(auth.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();

      afterClosedSubject.next('ok');
      tick();
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledOnceWith(['login']);
    }));
  });
});
