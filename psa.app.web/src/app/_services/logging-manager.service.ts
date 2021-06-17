import { Injectable } from '@angular/core';
import { User } from '../psa.app.core/models/user';
import { AuthService } from '../psa.app.core/providers/auth-service/auth-service';
import { UserSettings } from '../psa.app.core/models/user_settings';
import { AuthenticationManager } from './authentication-manager.service';
import { MatomoInjector, MatomoTracker } from 'ngx-matomo-v9';
import { environment } from '../../environments/environment';
import { LoggingService } from '../psa.app.core/providers/logging-service/logging-service';
import { JwtHelperService } from '@auth0/angular-jwt';

/**
 * @deprecated this Service will be removed by the backend-logging solution
 */
@Injectable({
  providedIn: 'root',
})
export class LoggingManagerService {
  private currentUser: User;
  private currentUserSettings: UserSettings = null;
  private jwtHelper: JwtHelperService = new JwtHelperService();

  constructor(
    auth: AuthenticationManager,
    private authService: AuthService,
    private loggingService: LoggingService,
    private matomoTracker: MatomoTracker,
    private matomoInjector: MatomoInjector
  ) {
    if (environment.matomoUrl) {
      this.matomoInjector.init(environment.matomoUrl, 1);
    }
    this.matomoTracker.setDocumentTitle('PIA Web App');

    let init = true;
    auth.currentUserObservable.subscribe(async (newUser) => {
      this.currentUser = newUser;
      if (newUser && newUser.role === 'Proband') {
        await this.loadCurrentUserSettings();
      }
      init = false;
    });
  }

  async postLog(log: { timestamp; app; activity }): Promise<void> {
    if (await this.isLoggingActive()) {
      this.matomoTracker.trackEvent(
        log.app,
        JSON.stringify(log.activity),
        this.currentUser.username
      );
    }
  }

  async postPageViewLog(url: string): Promise<void> {
    if (await this.isLoggingActive()) {
      await this.matomoTracker.setCustomUrl(url);
      await this.matomoTracker.trackPageView();
    }
  }

  async loadCurrentUserSettings(): Promise<void> {
    this.currentUserSettings = await this.authService.getUserSettings(
      this.currentUser.username
    );
  }

  private async isLoggingActive(): Promise<boolean> {
    if (!this.currentUser || this.currentUser.role !== 'Proband') {
      return false;
    }
    return this.currentUserSettings.logging_active;
  }
}
