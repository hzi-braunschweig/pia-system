/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PipeSection } from './PipeSection';
import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { HtmlDocument, PdfDocument } from '../template-documents';

let browserSingleton: Promise<Browser> | undefined;

export class PdfGenerator implements PipeSection<HtmlDocument, PdfDocument> {
  private readonly defaultOptions: PDFOptions = {
    format: 'a4',
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="width: 100%; font-size: 10px; text-align: center;"><span class="date"></span></div>',
    footerTemplate:
      '<div style="width: 100%; font-size: 10px; text-align: center;"><hr>' +
      '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: {
      bottom: '2cm', // minimum required for footer msg to display
      left: '2cm',
      right: '2cm',
      top: '2cm',
    },
    preferCSSPageSize: true,
  };

  private readonly options: PDFOptions;

  public constructor(options: PDFOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  public static async closeBrowser(): Promise<void> {
    if (!browserSingleton) {
      return;
    }
    const browser = await browserSingleton;
    browserSingleton = undefined;
    await browser.close();
  }

  public execute(input: HtmlDocument): PdfDocument {
    return new PdfDocument(this.generatePdf(input.htmlText));
  }

  private async generatePdf(htmlText: Promise<string>): Promise<Uint8Array> {
    let page: Page | undefined;
    let browser: Browser | undefined;
    try {
      if (!browserSingleton) {
        browserSingleton = puppeteer.launch({
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
    } catch (e) {
      console.error('Error at generating PDF: ', e);

      browserSingleton = undefined;
      if (browser) {
        void browser.close();
      }
      throw e;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}
