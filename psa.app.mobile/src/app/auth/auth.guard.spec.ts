import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import SpyObj = jasmine.SpyObj;
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  let auth: SpyObj<AuthService>;
  let router: SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'isPasswordChangeNeeded',
    ]);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
