/// <reference types="node" />
import { PipeSection } from './PipeSection';
import { PDFOptions } from 'puppeteer';
import { HtmlDocument, PdfDocument } from '../template-documents';
export declare class PdfGenerator implements PipeSection<HtmlDocument, PdfDocument> {
    private readonly defaultOptions;
    private readonly options;
    constructor(options: PDFOptions);
    static closeBrowser(): Promise<void>;
    execute(input: HtmlDocument): PdfDocument;
    generatePdf(htmlText: Promise<string>): Promise<Buffer>;
}
