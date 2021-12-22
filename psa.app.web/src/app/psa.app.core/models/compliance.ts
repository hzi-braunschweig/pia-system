/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegment } from './Segments';

export interface ComplianceAgreement {
  id: number;
  ids: string;
  username: string;
  study: string;
  firstname: string;
  lastname: string;
  birthdate: Date;
}

/**
 * Properties are null if a UT requests filled out compliances
 */
export interface ComplianceData {
  textfields: TextfieldCompliances | null;
  compliance_system: SystemCompliances | null;
  compliance_questionnaire: QuestionnairCompliance[] | null;
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
  birthdate?: Date;
  location?: string;
}

export interface SystemCompliances {
  app?: boolean;
  samples?: boolean;
  bloodsamples?: boolean;
  labresults?: boolean;
}

export interface QuestionnairCompliance {
  name: string;
  value: boolean | string;
}

export type ToBeFilledByRoles = 'Proband' | 'Untersuchungsteam';

export interface ComplianceText {
  compliance_text: string;
  compliance_text_object: TemplateSegment[];
}

export interface ComplianceTextInEditMode {
  to_be_filled_by: ToBeFilledByRoles;
  compliance_text: string;
}

export enum ComplianceType {
  SAMPLES,
  BLOODSAMPLES,
  LABRESULTS,
}

export interface GenericFieldDescription {
  type: 'TEXT' | 'RADIO';
  placeholder: string;
  label?: string;
}
