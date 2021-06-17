"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlDocument = void 0;
const TemplateDocument_1 = require("./TemplateDocument");
const AbstractTemplateDocument_1 = require("./AbstractTemplateDocument");
class HtmlDocument extends AbstractTemplateDocument_1.AbstractTemplateDocument {
    constructor(htmlText) {
        super();
        this.type = TemplateDocument_1.TemplateSegmentTypes.HTML;
        this.htmlText = Promise.resolve(htmlText);
    }
}
exports.HtmlDocument = HtmlDocument;
//# sourceMappingURL=HtmlDocument.js.map