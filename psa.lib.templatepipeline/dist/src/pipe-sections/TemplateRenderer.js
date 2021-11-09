"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRenderer = void 0;
const mustache_1 = require("mustache");
const template_documents_1 = require("../template-documents");
class TemplateRenderer {
    constructor(entity) {
        this.entity = entity;
    }
    execute(input) {
        return new template_documents_1.HtmlDocument(this.renderTemplate(input.htmlText));
    }
    async renderTemplate(htmlText) {
        return (0, mustache_1.render)(await htmlText, this.entity);
    }
}
exports.TemplateRenderer = TemplateRenderer;
//# sourceMappingURL=TemplateRenderer.js.map