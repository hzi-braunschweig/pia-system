import { HttpHandler, HttpHeaders, HttpRequest } from '@angular/common/http';
import SpyObj = jasmine.SpyObj;

import { ContentTypeInterceptor } from './content-type-interceptor';

describe('ContentTypeInterceptor', () => {
  it('should add a default Content-Type header if none is set', () => {
    const interceptor = new ContentTypeInterceptor();
    const request = new HttpRequest('GET', 'some/url/', {
      headers: new HttpHeaders(),
    });
    const cloneSpy = spyOn(request, 'clone').and.returnValue(request);
    const handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);

    interceptor.intercept(request, handler);
    expect(cloneSpy).toHaveBeenCalledWith({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
    expect(handler.handle).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if user is not logged in', () => {
    const interceptor = new ContentTypeInterceptor();
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const request = new HttpRequest('GET', 'some/url/', { headers });
    const cloneSpy = spyOn(request, 'clone');
    const handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);

    interceptor.intercept(request, handler);
    expect(cloneSpy).not.toHaveBeenCalled();
    expect(handler.handle).toHaveBeenCalledWith(request);
  });
});
