/**
 * General
 *
 * @typedef {{
 *     id: number,
 *     role: string,
 *     username: string,
 *     locale: string,
 *     app: string,
 *     iat: number,
 *     exp: number
 * }} DecodedToken
 */
/**
 * System logs
 *
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     type: string
 * }} SystemLogReq
 *
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     timestamp: Date,
 *     type: string
 * }} SystemLogRes
 *
 * @typedef {{
 *     requested_by: string,
 *     requested_for: string,
 *     timestamp: string,
 *     type: string
 * }} SystemLogDb
 *
 * @typedef {{
 *     fromTime: Date,
 *     toTime: Date,
 *     types: string[]
 * }} SystemLogFilter
 */
/**
 * User logs
 *
 * @typedef {{
 *     timestamp: Date,
 *     activity: {
 *         type: string,
 *         [questionnaireID]: number,
 *         [questionnaireName]: string,
 *         [questionnaireInstanceId]: number
 *     },
 *     app: string
 * }} UserLogReq
 *
 * @typedef {{
 *     timestamp: Date,
 *     activity: {
 *         type: string,
 *         [questionnaireID]: number,
 *         [questionnaireName]: string,
 *         [questionnaireInstanceId]: number
 *     },
 *     app: string
 * }} UserLogRes
 *
 * @typedef {{
 *     timestamp: Date,
 *     activity: {
 *         type: string,
 *         [questionnaireID]: number,
 *         [questionnaireName]: string,
 *         [questionnaireInstanceId]: number
 *     },
 *     app: string
 * }} UserLogDb
 *
 * @typedef {{
 *     fromTime: Date,
 *     toTime: Date,
 *     [probands]: string[],
 *     [questionnaires]: number[],
 *     [activities]: string[]
 * }} UserLogFilter
 */
