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
 *    deleteLogs: boolean,
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
 *    deleteLogs: boolean,
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
 *    delete_logs: boolean,
 *    for_instance_ids: number[]|null,
 *    for_lab_results_ids: string[]|null
 *  }} PendingPartialDeletionDb
 */
