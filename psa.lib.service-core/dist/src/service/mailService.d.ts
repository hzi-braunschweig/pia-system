import { MailserverConnection } from '../config/configModel';
export interface MailContent {
    subject: string;
    text?: string;
    html?: string;
}
export declare class MailService {
    private static readonly SMTP_OVER_SSL_PORT;
    private static mailTransporter;
    static initService(mailServerConfig: MailserverConnection): void;
    static sendMail(recipient: string, email: MailContent): Promise<boolean>;
}
