/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';

@Component({ template: '' })
export abstract class ContainerForFormControlUsageComponent
  implements OnDestroy
{
  @Output()
  public usedFormControls = new EventEmitter<Map<string, string[]>>();
  private usedFormControlsOfSubElements: Map<string, string[]>[] = [];
  protected allUsedFormControls: Map<string, string[]> = new Map();

  updateUsedFormControls(
    index: number,
    usedFormControls: Map<string, string[]>
  ): void {
    this.usedFormControlsOfSubElements[index] = usedFormControls;
    this.allUsedFormControls = this.usedFormControlsOfSubElements.reduce(
      (
        accumulator: Map<string, string[]>,
        currentValue: Map<string, string[]>
      ) => {
        currentValue.forEach((value, key) => accumulator.set(key, value));
        return accumulator;
      },
      new Map<string, string[]>()
    );
    this.usedFormControls.emit(this.allUsedFormControls);
  }

  ngOnDestroy(): void {
    this.usedFormControls.emit(new Map<string, string[]>());
  }
}
