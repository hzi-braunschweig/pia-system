/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegment } from '@pia/lib-templatepipeline';

export interface ComplianceReq {
  compliance_text: string;
  textfields: {
    firstname: string;
    birthdate: Date;
    location: string;
    lastname: string;
  };
  compliance_system: {
    app: boolean;
    labresults: boolean;
    bloodsamples: boolean;
    samples: boolean;
  };
  compliance_questionnaire: {
    name: string;
    value: boolean | string;
  }[];
}

export interface ComplianceRes {
  compliance_text_object: TemplateSegment[];
  compliance_text: string;
  textfields: {
    firstname: string;
    birthdate: Date;
    location: string;
    lastname: string;
  } | null;
  compliance_system: {
    app: boolean;
    labresults: boolean;
    bloodsamples: boolean;
    samples: boolean;
  } | null;
  compliance_questionnaire:
    | {
        name: string;
        value: boolean | string;
      }[]
    | null;
  timestamp: Date;
}

export interface Compliance {
  mappingId: string;
  study: string;
  timestamp: string;
  complianceText: string;
  username?: string;
  ids?: string;
  firstname?: string;
  lastname?: string;
  location?: string;
  birthdate?: Date;
  complianceApp: boolean;
  complianceBloodsamples: boolean;
  complianceLabresults: boolean;
  complianceSamples: boolean;
}
