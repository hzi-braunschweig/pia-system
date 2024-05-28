/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MatPaginatorIntl } from '@angular/material/paginator';
import { Injectable } from '@angular/core';

@Injectable()
export class MatPaginatorIntlGerman extends MatPaginatorIntl {
  // not translated because after refreshing page translate service is not loaded well
  itemsPerPageLabel = 'Pro Seite: ';
  nextPageLabel = 'Nächste Seite';
  previousPageLabel = 'Vorherige Seite';

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    return (
      page * pageSize +
      1 +
      ' - ' +
      (length < page * pageSize + pageSize
        ? length
        : page * pageSize + pageSize) +
      ' von ' +
      length
    );
  };
}
