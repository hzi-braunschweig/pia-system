/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

interface NgLetContext {
  $implicit: unknown;
  appNgLet: unknown;
}

@Directive({
  standalone: true,
  selector: '[appNgLet]',
})
export class NgLetDirective {
  @Input()
  set appNgLet(context: unknown) {
    this.context.$implicit = context;
    this.context.appNgLet = context;

    if (!this.hasEmbeddedView) {
      this.vcRef.createEmbeddedView(this.templateRef, this.context);
      this.hasEmbeddedView = true;
    }
  }

  private context: NgLetContext = {
    $implicit: null,
    appNgLet: null,
  };

  private hasEmbeddedView: boolean = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private vcRef: ViewContainerRef
  ) {}
}
