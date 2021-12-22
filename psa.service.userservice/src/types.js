/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @typedef {{
 *   [transaction]: TransactionWrapper
 * }} IOptions
 */
/**
 * @typedef {{
 *    requestedFor: string,
 *    probandId: string,
 *    fromDate: Date,
 *    toDate: Date,
 *    [forInstanceIds]: number[],
 *    [forLabResultsIds]: string[]
 *  }} PendingPartialDeletionReq
 *
 * @typedef {{
 *    id: number,
 *    requestedBy: string,
 *    requestedFor: string,
 *    probandId: string,
 *    fromDate: Date,
 *    toDate: Date,
 *    [forInstanceIds]: number[],
 *    [forLabResultsIds]: string[]
 *  }} PendingPartialDeletionRes
 *
 * @typedef {{
 *    [id]: number,
 *    requested_by: string,
 *    requested_for: string,
 *    proband_id: string,
 *    from_date: Date,
 *    to_date: Date,
 *    for_instance_ids: number[]|null,
 *    for_lab_results_ids: string[]|null
 *  }} PendingPartialDeletionDb
 */
