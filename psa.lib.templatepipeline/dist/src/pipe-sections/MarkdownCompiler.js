"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownCompiler = void 0;
const marked_1 = require("marked");
const template_documents_1 = require("../template-documents");
const jsdom_1 = require("jsdom");
const dompurify_1 = __importDefault(require("dompurify"));
const window = new jsdom_1.JSDOM('').window;
const domPurify = (0, dompurify_1.default)(window);
class MarkdownCompiler {
    constructor(tags) {
        this.allowedTags = tags;
    }
    execute(input) {
        return new template_documents_1.HtmlDocument(this.parseMarkdown(input.markdownText));
    }
    async parseMarkdown(markdownText) {
        return marked_1.marked.parse(domPurify.sanitize(await markdownText, {
            ADD_TAGS: this.allowedTags,
        }));
    }
}
exports.MarkdownCompiler = MarkdownCompiler;
//# sourceMappingURL=MarkdownCompiler.js.map