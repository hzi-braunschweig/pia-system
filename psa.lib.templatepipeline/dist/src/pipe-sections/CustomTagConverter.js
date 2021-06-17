"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTagConverter = void 0;
const Parse5TypeGuards_1 = require("../Parse5TypeGuards");
const template_documents_1 = require("../template-documents");
class CustomTagConverter {
    execute(input) {
        return new template_documents_1.DomDocument(this.convertAllCustomRadioTags(input.dom));
    }
    async convertAllCustomRadioTags(dom) {
        const document = await dom;
        document.childNodes.forEach((node) => this.convertAllSubNodes(node));
        return document;
    }
    convertAllSubNodes(node) {
        if (Parse5TypeGuards_1.isParentNode(node)) {
            node.childNodes.forEach((child) => this.convertAllSubNodes(child));
        }
        if (Parse5TypeGuards_1.isElement(node) && node.tagName === this.tagName) {
            this.convertNode(node);
        }
    }
}
exports.CustomTagConverter = CustomTagConverter;
//# sourceMappingURL=CustomTagConverter.js.map