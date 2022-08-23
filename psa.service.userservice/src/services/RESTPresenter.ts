/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PlannedProbandDeprecated } from '../models/plannedProband';

interface Link {
  href: string;
}

interface LinkBlock {
  [key: string]: Link;

  self: Link;
}

export interface RESTResponse {
  links: LinkBlock;
}

/**
 * @description json REST presenter
 */
export class RESTPresenter {
  /**
   * Presents a planned probands array as a REST compliant json object
   */
  public static presentPlannedProbands(
    plannedprobands: PlannedProbandDeprecated[]
  ): RESTResponse & { plannedprobands: PlannedProbandDeprecated[] } {
    return {
      plannedprobands,
      links: {
        self: { href: '/plannedprobands' },
      },
    };
  }

  /**
   * Presents a planned proband object as a REST compliant json object
   */
  public static presentPlannedProband(
    plannedProband: PlannedProbandDeprecated | null
  ): (RESTResponse & PlannedProbandDeprecated) | null {
    if (plannedProband) {
      return {
        ...plannedProband,
        links: {
          self: { href: '/plannedprobands/' + plannedProband.user_id },
        },
      };
    }
    return plannedProband;
  }
}
