"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlSerializer = void 0;
const parse5_1 = require("parse5");
const template_documents_1 = require("../template-documents");
class HtmlSerializer {
    execute(input) {
        return new template_documents_1.HtmlDocument(this.serializeHtml(input.dom));
    }
    async serializeHtml(dom) {
        return (0, parse5_1.serialize)(await dom);
    }
}
exports.HtmlSerializer = HtmlSerializer;
//# sourceMappingURL=HtmlSerializer.js.map