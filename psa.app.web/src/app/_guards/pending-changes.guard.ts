/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Observable } from 'rxjs';
import { CanDeactivate } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

/**
 * This guard checks whether there are pending changes in the current component.
 * Therefore that component has to implement the ComponentCanDeactivate interface.
 * If the canDeactivate method returns true, it allows navigation, otherwise it asks for confirmation.
 */
@Injectable({
  providedIn: 'root',
})
export class PendingChangesGuard
  implements CanDeactivate<ComponentCanDeactivate>
{
  constructor(private translate: TranslateService) {}

  canDeactivate(
    component: ComponentCanDeactivate
  ): boolean | Observable<boolean> {
    if (component.canDeactivate()) {
      // if there are no pending changes, just allow deactivation
      return true;
    } else {
      // else confirm first
      // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
      // when navigating away from your angular app, the browser will show a generic warning message
      // see http://stackoverflow.com/a/42207299/7307355
      return confirm(this.translate.instant('WARNING.ANSWERS'));
    }
  }
}
