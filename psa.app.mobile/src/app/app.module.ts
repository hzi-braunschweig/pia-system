import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import localeDeExtra from '@angular/common/locales/extra/de';
import localeEnExtra from '@angular/common/locales/extra/en';
import { ReactiveFormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { File } from '@ionic-native/file/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { Chooser } from '@ionic-native/chooser/ngx';
import { MarkdownModule } from 'ngx-markdown';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Network } from '@ionic-native/network/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LocaleService } from './shared/services/locale/locale.service';
import { AuthInterceptor } from './shared/interceptors/auth-interceptor';
import { ContentTypeInterceptor } from './shared/interceptors/content-type-interceptor';
import { UnauthorizedInterceptor } from './shared/interceptors/unauthorized-interceptor';
import { HttpErrorInterceptor } from './shared/interceptors/http-error-interceptor.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

registerLocaleData(localeEn, 'en', localeEnExtra);
registerLocaleData(localeDe, 'de', localeDeExtra);

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    MarkdownModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
    {
      provide: LOCALE_ID,
      useFactory: (localeService: LocaleService) => {
        return localeService.currentLocale;
      },
      deps: [LocaleService],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ContentTypeInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
    StatusBar,
    SplashScreen,
    AppVersion,
    FileOpener,
    File,
    Keyboard,
    BarcodeScanner,
    Camera,
    Chooser,
    FirebaseX,
    Network,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
