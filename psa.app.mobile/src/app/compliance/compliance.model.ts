/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegment } from './segment.model';

export interface ComplianceData {
  textfields: TextfieldCompliances;
  compliance_system: SystemCompliances;
  compliance_questionnaire: QuestionnaireCompliance[];
}

export interface ComplianceDataRequest extends ComplianceData {
  compliance_text: string;
}

export interface ComplianceDataResponse extends ComplianceData {
  compliance_text_object: TemplateSegment[];
  timestamp: Date;
}

export interface TextfieldCompliances {
  firstname?: string;
  lastname?: string;
  location?: string;
  birthdate?: Date;
  timestamp?: string;
}

export interface SystemCompliances {
  app?: boolean;
  samples?: boolean;
  bloodsamples?: boolean;
  labresults?: boolean;
}

export interface QuestionnaireCompliance {
  name: string;
  value: boolean | string;
}

export interface ComplianceText {
  compliance_text: string;
  compliance_text_object: TemplateSegment[];
}

export enum ComplianceType {
  SAMPLES,
  BLOODSAMPLES,
  LABRESULTS,
  APP,
}
