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
import { LoginComponent } from './login.component';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  convertToParamMap,
  ParamMap,
  Router,
} from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { createLoginResponse } from '../../psa.app.core/models/instance.helper.spec';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import Spy = jasmine.Spy;
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import anything = jasmine.anything;

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let queryParamMapGetter: Spy<() => ParamMap>;
  let authService: SpyObj<AuthService>;
  let auth: SpyObj<AuthenticationManager>;
  let router: SpyObj<Router>;

  beforeEach(async () => {
    // Provider and Services
    authService = createSpyObj<AuthService>('AuthService', [
      'loginWithToken',
      'login',
    ]);
    auth = createSpyObj<AuthenticationManager>('AuthenticationManager', [
      'getToken',
      'logout',
      'getLoginToken',
    ]);
    router = createSpyObj<Router>('Router', ['navigate']);
    const snapshot = createSpyObj<ActivatedRouteSnapshot>(
      'ActivatedRouteSnapshot',
      undefined,
      ['queryParamMap']
    );
    queryParamMapGetter = Object.getOwnPropertyDescriptor(
      snapshot,
      'queryParamMap'
    ).get as Spy;

    // Build Base Module
    await MockBuilder(LoginComponent, AppModule)
      .provide({
        provide: ActivatedRoute,
        useValue: { snapshot },
      })
      .keep(FormBuilder)
      .mock(AuthService, authService)
      .mock(AuthenticationManager, auth)
      .mock(Router, router);
  });

  describe('create component', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      authService.login.and.resolveTo(createLoginResponse());
      auth.getToken.and.returnValue('Valid Token');
      auth.getLoginToken.and.returnValue('Valid Login Token');
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));

      // Create component
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should create the component and logout if was loggedin', () => {
      expect(component).toBeDefined();
      expect(auth.getToken).toHaveBeenCalled();
      expect(auth.logout).toHaveBeenCalled();
      expect(component.form.get('username').disabled).toBeTrue();
    });
  });

  describe('login() without loginToken', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      authService.login.and.resolveTo(createLoginResponse());
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));

      // Create component
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should execute the login', fakeAsync(() => {
      component.login();
      tick();
      expect(authService.login).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/home'], anything());
    }));

    it('should execute navigate to change password page if pw change needed', fakeAsync(() => {
      authService.login.and.resolveTo(
        createLoginResponse({}, { pw_change_needed: true })
      );
      component.login();
      tick();
      expect(authService.login).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/changePassword']);
    }));
  });

  describe('login() with loginToken', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      authService.loginWithToken.and.resolveTo(createLoginResponse());
      auth.getLoginToken.and.returnValue('Valid Login Token');
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));

      // Create component
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(); // wait for ngOnInit to finish
    }));

    it('should execute the login', fakeAsync(() => {
      component.login();
      tick();
      expect(authService.loginWithToken).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/home'], anything());
    }));
  });
});
