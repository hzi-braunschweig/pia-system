export interface DatabaseNotification {
    name: string;
    payload: string;
    channel: string;
}
export interface ParsedDatabasePayload {
    table: string;
    row: unknown;
    row_old: unknown;
    row_new: unknown;
}
