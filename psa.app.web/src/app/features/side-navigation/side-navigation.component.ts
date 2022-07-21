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
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { DialogOkCancelComponent } from '../../_helpers/dialog-ok-cancel';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { Page, PageManager } from '../../_services/page-manager.service';
import { SelectedProbandInfoService } from '../../_services/selected-proband-info.service';
import { filter } from 'rxjs/operators';
import { CurrentUser } from '../../_services/current-user.service';

@Component({
  selector: 'app-side-navigation',
  providers: [RequestNewMaterialComponent],
  templateUrl: 'side-navigation.component.html',
  styleUrls: ['side-navigation.component.scss'],
})
export class SideNavigationComponent {
  private static readonly roles = {
    Proband: 'ROLES.PROBAND',
    Forscher: 'ROLES.RESEARCHER',
    Untersuchungsteam: 'ROLES.RESEARCH_TEAM',
    ProbandenManager: 'ROLES.PROBANDS_MANAGER',
    EinwilligungsManager: 'ROLES.COMPLIANCE_MANAGER',
    SysAdmin: 'ROLES.SYSTEM_ADMINISTRATOR',
  };

  @Input() public sidenav?: MatSidenav;

  public currentRoleUI: string = SideNavigationComponent.roles[this.user.role];
  public selectedPage: Page;
  public pages: Page[];
  public selectedPseudonymUI: string = null;
  public selectedIDSUI: string = null;

  constructor(
    public user: CurrentUser,
    private router: Router,
    private matDialog: MatDialog,
    private authenticationService: AuthService,
    private auth: AuthenticationManager,
    private pageManager: PageManager,
    private selectedProbandInfoService: SelectedProbandInfoService
  ) {
    this.selectedProbandInfoService.sideNavState$.subscribe((resultList) =>
      this.updateSelectedProbandInfo(resultList)
    );

    this.pageManager.navPages$.subscribe((pages) => {
      this.pages = pages;
      this.updateSelectedPage();
    });

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.updateSelectedPage();
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
      return;
    }
    const foundPage = this.pages.find((page) => {
      return page.subpaths.some((subpath) => url.includes(subpath));
    });
    const foundExactPage = this.pages.find((page) => {
      const firstPartOfUrl = url.substring(1, url.length).split('/')[0] + '/';
      if (
        firstPartOfUrl === 'questionnaire/' &&
        this.user.role === 'Forscher'
      ) {
        const lastPartOfUrl = url.substring(1, url.length).split('/')[3];
        return page.subpaths.some((subpath) => lastPartOfUrl === subpath);
      } else {
        return page.subpaths.some((subpath) => firstPartOfUrl === subpath);
      }
    });
    this.selectedPage = foundExactPage ?? foundPage ?? this.pages[0];
  }

  public async logout(): Promise<void> {
    if (!!this.sidenav) {
      this.sidenav.close();
    }

    if (this.user.isProband()) {
      this.openDialog();
    } else {
      await this.auth.logout();
    }
  }

  public openPage(page: Page): void {
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

    dialogRef
      .afterClosed()
      .pipe(filter((result) => result === 'ok'))
      .subscribe(async () => await this.auth.logout());
  }
}
