/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @typedef {{
 *    compliance_text: string,
 *    textfields: {
 *      firstname: string,
 *      birthdate: Date,
 *      location: string,
 *      lastname: string
 *    },
 *    compliance_system: {
 *      app: boolean,
 *      labresults: boolean,
 *      bloodsamples: boolean,
 *      samples: boolean
 *    },
 *    compliance_questionnaire: { name: string, value: boolean | string }[],
 *  }} ComplianceReq
 *
 * @typedef {{
 *    [compliance_text_object]: import('@pia/lib-templatepipeline').TemplateSegment[],
 *    [compliance_text]: string,
 *    textfields: {
 *      [firstname]: string,
 *      [birthdate]: Date,
 *      [location]: string,
 *      [lastname]: string
 *    },
 *    compliance_system: {
 *      app: boolean,
 *      labresults: boolean,
 *      bloodsamples: boolean,
 *      samples: boolean
 *    },
 *    compliance_questionnaire: { name: string, value: boolean | string }[],
 *    timestamp: Date
 *  }} ComplianceRes
 *
 * @typedef {{
 *   [transaction]: TransactionWrapper
 * }} IOptions
 */
