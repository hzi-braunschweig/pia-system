/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { contentTypeInterceptor } from './content-type-interceptor';
import { of } from 'rxjs';

describe('contentTypeInterceptor', () => {
  it('should add a default Content-Type header if none is set', () => {
    const request = new HttpRequest('GET', 'some/url/', {
      headers: new HttpHeaders(),
    });
    const cloneSpy = spyOn(request, 'clone').and.returnValue(request);
    const next = jasmine.createSpy('next').and.returnValue(of({}));

    contentTypeInterceptor(request, next as HttpHandlerFn);

    expect(cloneSpy).toHaveBeenCalledWith({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
    expect(next).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if Content-Type is already set', () => {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const request = new HttpRequest('GET', 'some/url/', { headers });
    const cloneSpy = spyOn(request, 'clone');
    const next = jasmine.createSpy('next').and.returnValue(of({}));

    contentTypeInterceptor(request, next as HttpHandlerFn);

    expect(cloneSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(request);
  });
});
