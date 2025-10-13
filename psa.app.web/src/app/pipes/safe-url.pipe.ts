/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: false,
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private readonly domSanitizer: DomSanitizer) {}

  transform(url: any): any {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
