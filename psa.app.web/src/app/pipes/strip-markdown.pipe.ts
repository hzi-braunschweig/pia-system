/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import * as removeMD from 'remove-markdown';

@Pipe({ name: 'stripMarkdown' })
export class StripMarkdown implements PipeTransform {
  transform(text: string): any {
    return removeMD(text);
  }
}
