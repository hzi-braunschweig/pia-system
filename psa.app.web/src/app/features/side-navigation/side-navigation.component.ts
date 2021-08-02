/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Event, NavigationEnd, Router } from '@angular/router';
import { RequestNewMaterialComponent } from '../../pages/laboratories/request-new-material/request-new-material.component';
import { User } from '../../psa.app.core/models/user';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { DialogOkCancelComponent } from '../../_helpers/dialog-ok-cancel';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { Page, PageManager } from '../../_services/page-manager.service';
import { LoggingManagerService } from '../../_services/logging-manager.service';
import { SelectedProbandInfoService } from '../../_services/selected-proband-info.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-side-navigation',
  providers: [RequestNewMaterialComponent],
  templateUrl: 'side-navigation.component.html',
  styleUrls: ['side-navigation.component.scss'],
})
export class SideNavigationComponent {
  @Input() sidenav?: MatSidenav;

  currentUser: User;
  currentRoleUI: string = null;
  selectedPage: Page;
  pages: Page[];
  selectedPseudonymUI: string = null;
  selectedIDSUI: string = null;
  roles = {
    Proband: 'ROLES.PROBAND',
    Forscher: 'ROLES.RESEARCHER',
    Untersuchungsteam: 'ROLES.RESEARCH_TEAM',
    ProbandenManager: 'ROLES.PROBANDS_MANAGER',
    EinwilligungsManager: 'ROLES.COMPLIANCE_MANAGER',
    SysAdmin: 'ROLES.SYSTEM_ADMINISTRATOR',
  };

  sideNavStateSubscription: Subscription;

  constructor(
    private router: Router,
    private matDialog: MatDialog,
    private authenticationService: AuthService,
    private auth: AuthenticationManager,
    private pageManager: PageManager,
    private selectedProbandInfoService: SelectedProbandInfoService,
    private loggingManager: LoggingManagerService
  ) {
    this.auth.currentUserObservable.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.currentRoleUI = this.roles[this.auth.currentRole] || null;
      }
      if (this.sideNavStateSubscription) {
        this.sideNavStateSubscription.unsubscribe();
      }
      if (this.auth.currentRole === 'Untersuchungsteam') {
        this.sideNavStateSubscription =
          this.selectedProbandInfoService.sideNavState$.subscribe(
            (resultList) => this.updateSelectedProbandInfo(resultList)
          );
      }
    });

    this.pageManager.navPagesObservable.subscribe((pages) => {
      this.pages = pages;
      this.updateSelectedPage();
    });

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.updateSelectedPage();
        this.loggingManager.postPageViewLog(this.router.url);
      }
    });
  }

  private updateSelectedProbandInfo(info): void {
    if (!info) {
      this.selectedIDSUI = null;
      this.selectedPseudonymUI = null;
    } else {
      this.selectedIDSUI = info.ids;
      this.selectedPseudonymUI = info.pseudonym;
    }
  }

  private updateSelectedPage(): void {
    const url = this.router.url;
    if (!this.pages || this.pages.length === 0) {
      this.selectedPage = undefined;
    }
    const foundPage = this.pages.find((page) => {
      return page.subpaths.some((subpath) => url.includes(subpath));
    });
    const foundExactPage = this.pages.find((page) => {
      const firstPartOfUrl = url.substring(1, url.length).split('/')[0] + '/';
      if (
        firstPartOfUrl === 'questionnaire/' &&
        this.auth.currentRole === 'Forscher'
      ) {
        const lastPartOfUrl = url.substring(1, url.length).split('/')[3];
        return page.subpaths.some((subpath) => lastPartOfUrl === subpath);
      } else {
        return page.subpaths.some((subpath) => firstPartOfUrl === subpath);
      }
    });
    this.selectedPage = foundExactPage
      ? foundExactPage
      : foundPage
      ? foundPage
      : this.pages[0];
  }

  async logout(): Promise<void> {
    if (!!this.sidenav) {
      this.sidenav.close();
    }

    if (this.auth.currentRole === 'Proband') {
      this.openDialog();
    } else {
      await this.auth.logout();
      this.router.navigate(['login']);
    }
  }

  openPage(page: Page): void {
    if (!!this.sidenav) {
      this.sidenav.close();
    }

    this.router.navigate(page.path).then((fulfilled) => {
      if (!fulfilled) {
        this.updateSelectedPage();
      }
    });
  }

  private openDialog(): void {
    const dialogRef = this.matDialog.open(DialogOkCancelComponent, {
      width: '450px',
      data: {
        q: 'SIDENAV.LOGOUT_DIALOG.QUESTION',
        content: 'SIDENAV.LOGOUT_DIALOG.CONTENT',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'ok') {
        await this.auth.logout();
        this.router.navigate(['login']);
      }
    });
  }
}
