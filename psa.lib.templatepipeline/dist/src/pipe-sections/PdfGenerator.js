"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfGenerator = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const template_documents_1 = require("../template-documents");
let browser;
class PdfGenerator {
    constructor(options) {
        this.defaultOptions = {
            format: 'a4',
            displayHeaderFooter: true,
            headerTemplate: '<div style="width: 100%; font-size: 10px; text-align: center;"><span class="date"></span></div>',
            footerTemplate: '<div style="width: 100%; font-size: 10px; text-align: center;"><hr>' +
                '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
            margin: {
                bottom: '2cm',
                left: '2cm',
                right: '2cm',
                top: '2cm',
            },
            preferCSSPageSize: true,
        };
        this.options = { ...this.defaultOptions, ...options };
    }
    static async closeBrowser() {
        if (!browser) {
            return;
        }
        await browser.close();
        browser = undefined;
    }
    execute(input) {
        return new template_documents_1.PdfDocument(this.generatePdf(input.htmlText));
    }
    async generatePdf(htmlText) {
        if (!browser) {
            browser = await puppeteer_1.default.launch({
                args: ['--disable-dev-shm-usage', '--no-sandbox'],
            });
        }
        const page = await browser.newPage();
        try {
            await page.setContent(await htmlText);
            return await page.pdf(this.options);
        }
        catch (e) {
            console.error(e);
            throw e;
        }
        finally {
            await page.close();
        }
    }
}
exports.PdfGenerator = PdfGenerator;
//# sourceMappingURL=PdfGenerator.js.map