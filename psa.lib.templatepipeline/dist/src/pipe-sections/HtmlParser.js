"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlParser = void 0;
const parse5_1 = require("parse5");
const Parse5TypeGuards_1 = require("../Parse5TypeGuards");
const template_documents_1 = require("../template-documents");
class HtmlParser {
    execute(input) {
        return new template_documents_1.DomDocument(this.parseHtml(input.htmlText));
    }
    async parseHtml(htmlText) {
        const parsedHtml = parse5_1.parseFragment(await htmlText);
        if (!Parse5TypeGuards_1.isParentNode(parsedHtml)) {
            throw Error('Could not parse the html');
        }
        return parsedHtml;
    }
}
exports.HtmlParser = HtmlParser;
//# sourceMappingURL=HtmlParser.js.map