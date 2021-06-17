"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownDocument = void 0;
const TemplateDocument_1 = require("./TemplateDocument");
const AbstractTemplateDocument_1 = require("./AbstractTemplateDocument");
class MarkdownDocument extends AbstractTemplateDocument_1.AbstractTemplateDocument {
    constructor(markdownText) {
        super();
        this.type = TemplateDocument_1.TemplateSegmentTypes.MARKDOWN;
        this.markdownText = Promise.resolve(markdownText);
    }
}
exports.MarkdownDocument = MarkdownDocument;
//# sourceMappingURL=MarkdownDocument.js.map