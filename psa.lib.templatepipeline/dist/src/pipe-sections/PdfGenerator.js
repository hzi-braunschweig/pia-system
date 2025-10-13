"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfGenerator = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const template_documents_1 = require("../template-documents");
let browserSingleton;
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
        if (!browserSingleton) {
            return;
        }
        const browser = await browserSingleton;
        browserSingleton = undefined;
        await browser.close();
    }
    execute(input) {
        return new template_documents_1.PdfDocument(this.generatePdf(input.htmlText));
    }
    async generatePdf(htmlText) {
        let page;
        let browser;
        try {
            if (!browserSingleton) {
                browserSingleton = puppeteer_1.default.launch({
                    headless: 'shell',
                    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
                    env: {
                        ...process.env,
                        XDG_CONFIG_HOME: '/tmp/.chromium',
                        XDG_CACHE_HOME: '/tmp/.chromium',
                    },
                });
            }
            browser = await browserSingleton;
            page = await browser.newPage();
            await page.setContent(await htmlText, { waitUntil: 'domcontentloaded' });
            return await page.pdf(this.options);
        }
        catch (e) {
            console.error('Error at generating PDF: ', e);
            browserSingleton = undefined;
            if (browser) {
                browser.close();
            }
            throw e;
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
}
exports.PdfGenerator = PdfGenerator;
//# sourceMappingURL=PdfGenerator.js.map