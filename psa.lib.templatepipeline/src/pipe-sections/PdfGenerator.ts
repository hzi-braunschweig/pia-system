/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PipeSection } from './PipeSection';
import { Browser, launch, PDFOptions } from 'puppeteer';
import { HtmlDocument, PdfDocument } from '../template-documents';

let browser: Browser | undefined;

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
    if (!browser) {
      return;
    }
    await browser.close();
    browser = undefined;
  }

  public execute(input: HtmlDocument): PdfDocument {
    return new PdfDocument(this.generatePdf(input.htmlText));
  }

  public async generatePdf(htmlText: Promise<string>): Promise<Buffer> {
    if (!browser) {
      browser = await launch({
        args: ['--disable-dev-shm-usage', '--no-sandbox'],
      });
    }

    const page = await browser.newPage();
    try {
      await page.setContent(await htmlText);
      return await page.pdf(this.options);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      await page.close();
    }
  }
}
