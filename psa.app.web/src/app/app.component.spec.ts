/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MockBuilder } from 'ng-mocks';
import { of } from 'rxjs';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { CurrentUser } from './_services/current-user.service';
import SpyObj = jasmine.SpyObj;

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  let currentUser: SpyObj<CurrentUser>;
  let mediaObserver: SpyObj<MediaObserver>;
  let translate: SpyObj<TranslateService>;

  beforeEach(async () => {
    currentUser = jasmine.createSpyObj('CurrentUser', ['init']);
    currentUser.init.and.resolveTo(true);

    mediaObserver = jasmine.createSpyObj('MediaObserver', ['asObservable']);
    mediaObserver.asObservable.and.returnValue(
      of([new MediaChange(true, 'somemq', 'lt-md')])
    );

    translate = jasmine.createSpyObj('TranslateService', ['get']);
    translate.get.and.returnValue(of('this is a dev system'));

    await MockBuilder(AppComponent, AppModule)
      .mock(MediaObserver, mediaObserver)
      .mock(TranslateService, translate);
  });

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }));

  describe('ngOnInit()', () => {
    it('should subscribe to media changes', fakeAsync(() => {
      expect(mediaObserver.asObservable).toHaveBeenCalledTimes(1);
      expect(component.isLtMd).toBeTrue();
    }));

    it('should show snack bar on development systems', () => {
      const snackBar = TestBed.inject(MatSnackBar) as SpyObj<MatSnackBar>;
      expect(snackBar.open).toHaveBeenCalledOnceWith(
        'this is a dev system',
        'X',
        {
          panelClass: ['snack-bar-error'],
          duration: 10000,
        }
      );
    });
  });

  describe('navigationMode', () => {
    it('should return "over" if isLtMd true', () => {
      component.isLtMd = true;
      expect(component.navigationMode).toEqual('over');
    });

    it('should return "side" if isLtMd false', () => {
      component.isLtMd = false;
      expect(component.navigationMode).toEqual('side');
    });
  });
});
