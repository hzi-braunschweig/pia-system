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
import { SelectedProbandData } from '../../psa.app.core/models/selectedProbandData';
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
  let auth: SpyObj<AuthenticationManager>;
  let navPagesObservableMock: BehaviorSubject<Page[]>;
  let pageManager: SpyObj<PageManager>;
  let sideNavStateMock: BehaviorSubject<SelectedProbandData>;
  let selectedProbandInfoService: SpyObj<SelectedProbandInfoService>;
  let matDialog: SpyObj<MatDialog>;
  let afterClosedSubject: Subject<string>;

  beforeEach(async () => {
    // Provider and Services
    auth = createSpyObj<AuthenticationManager>('AuthenticationManager', [
      'logout',
    ]);

    navPagesObservableMock = new BehaviorSubject<Page[]>([
      { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
    ]);
    pageManager = createSpyObj<PageManager>('PageManager', undefined, {
      navPages$: navPagesObservableMock,
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

    const dialogRef = createSpyObj<MatDialogRef<DialogOkCancelComponent>>(
      'dialogRef',
      ['afterClosed']
    );
    afterClosedSubject = new Subject();
    dialogRef.afterClosed.and.returnValue(afterClosedSubject);
    matDialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    matDialog.open.and.returnValue(dialogRef);

    // Build Base Module
    await MockBuilder(SideNavigationComponent, AppModule)
      .mock(AuthenticationManager, auth)
      .mock(Router, router)
      .mock(PageManager, pageManager)
      .mock(SelectedProbandInfoService, selectedProbandInfoService)
      .mock(MatDialog, matDialog);
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
    it('should close the side navigation and call logout', fakeAsync(() => {
      createComponent();
      const sidenav = createSpyObj<MatSidenav>('sidenav', ['close']);
      component.sidenav = sidenav;
      component.logout();
      tick();
      expect(sidenav.close).toHaveBeenCalled();
      expect(auth.logout).toHaveBeenCalledTimes(1);
    }));
  });
});
