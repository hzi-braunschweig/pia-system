import { TestBed } from '@angular/core/testing';

import { LocaleService } from './locale.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from '../../environments/environment';

describe('LocaleService', () => {
  function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient],
          },
        }),
      ],
    });
  });

  it('should be created', () => {
    const newService: LocaleService = TestBed.get(LocaleService);
    expect(newService).toBeTruthy();
  });

  describe('setting the locale', () => {
    let service: LocaleService;
    beforeEach((done) => {
      environment.defaultLanguage = 'en-US';
      service = TestBed.get(LocaleService);
      setTimeout(done, 100);
    });

    it('should apply de-DE', () => {
      service.currentLocale = 'de-DE';
      expect(service.currentLocale).toEqual('de-DE');
    });

    it('should apply en-US as default for undefined', () => {
      service.currentLocale = undefined;
      expect(service.currentLocale).toEqual('en-US');
    });

    it('should apply en-US as default for random string', () => {
      service.currentLocale = 'cvrdce';
      expect(service.currentLocale).toEqual('en-US');
    });

    it('should apply en-US as ISO639-1 mapping for en', () => {
      service.currentLocale = 'en';
      expect(service.currentLocale).toEqual('en-US');
    });

    it('should apply de-DE as ISO639-1 mapping for de', () => {
      service.currentLocale = 'de';
      expect(service.currentLocale).toEqual('de-DE');
    });

    it('should apply de-DE for de-de', () => {
      service.currentLocale = 'de-de';
      expect(service.currentLocale).toEqual('de-DE');
    });

    it('should apply de-DE for non existing german accent de-AC by ISO639-1 mapping', () => {
      service.currentLocale = 'de-AC';
      expect(service.currentLocale).toEqual('de-DE');
    });
  });
});
