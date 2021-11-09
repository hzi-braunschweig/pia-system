"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sanitizeHtml_1 = require("../utils/sanitizeHtml");
class MailService {
    static initService(mailServerConfig) {
        let secure = false;
        if (mailServerConfig.port === MailService.SMTP_OVER_SSL_PORT) {
            secure = true;
        }
        console.log(`Using ${mailServerConfig.host}:${mailServerConfig.port} as smtp Server, ${secure ? 'secure' : 'NOT secure'}, ${mailServerConfig.requireTLS ? 'requireTLS' : 'DONT requireTLS'}`);
        MailService.mailTransporter = nodemailer_1.default.createTransport({
            host: mailServerConfig.host,
            port: mailServerConfig.port,
            auth: mailServerConfig.user || mailServerConfig.password
                ? {
                    user: mailServerConfig.user,
                    pass: mailServerConfig.password,
                }
                : undefined,
            secure: secure,
            requireTLS: mailServerConfig.requireTLS,
        }, {
            from: `"${mailServerConfig.name}" <${mailServerConfig.from}>`,
        });
    }
    static async sendMail(recipient, email) {
        if (!MailService.mailTransporter) {
            throw new Error('MailService was not initialized');
        }
        const mailOptions = {
            to: recipient,
            subject: email.subject,
            text: email.text,
            html: email.html ? (0, sanitizeHtml_1.sanitizeHtml)(email.html) : undefined,
        };
        const result = await MailService.mailTransporter.sendMail(mailOptions);
        return result.accepted.includes(recipient);
    }
}
exports.MailService = MailService;
MailService.SMTP_OVER_SSL_PORT = 465;
//# sourceMappingURL=mailService.js.map