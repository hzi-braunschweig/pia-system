/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { StudyStatus } from '../psa.app.core/models/study';

/**
 * Returns the translation key of an account status
 */
@Pipe({ name: 'studyStatusConvert' })
export class StudyStatusPipe implements PipeTransform {
  public transform(status: StudyStatus): string {
    if (status === 'active') {
      return 'STUDIES.STATUS_ACTIVE';
    } else if (status === 'deletion_pending') {
      return 'STUDIES.STATUS_DELETION_PENDING';
    } else if (status === 'deleted') {
      return 'STUDIES.STATUS_DELETED';
    }
    return 'UNDEFINED';
  }
}
