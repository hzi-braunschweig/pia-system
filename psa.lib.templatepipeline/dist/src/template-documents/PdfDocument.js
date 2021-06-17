"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfDocument = void 0;
const TemplateDocument_1 = require("./TemplateDocument");
const AbstractTemplateDocument_1 = require("./AbstractTemplateDocument");
class PdfDocument extends AbstractTemplateDocument_1.AbstractTemplateDocument {
    constructor(pdf) {
        super();
        this.type = TemplateDocument_1.TemplateSegmentTypes.PDF;
        this.pdf = Promise.resolve(pdf);
    }
}
exports.PdfDocument = PdfDocument;
//# sourceMappingURL=PdfDocument.js.map