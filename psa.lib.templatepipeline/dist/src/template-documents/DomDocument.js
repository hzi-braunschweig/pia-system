"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomDocument = void 0;
const TemplateDocument_1 = require("./TemplateDocument");
const AbstractTemplateDocument_1 = require("./AbstractTemplateDocument");
class DomDocument extends AbstractTemplateDocument_1.AbstractTemplateDocument {
    constructor(dom) {
        super();
        this.type = TemplateDocument_1.TemplateSegmentTypes.DOM;
        this.dom = Promise.resolve(dom);
    }
}
exports.DomDocument = DomDocument;
//# sourceMappingURL=DomDocument.js.map