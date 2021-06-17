"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentedDocument = void 0;
const TemplateDocument_1 = require("./TemplateDocument");
const AbstractTemplateDocument_1 = require("./AbstractTemplateDocument");
class SegmentedDocument extends AbstractTemplateDocument_1.AbstractTemplateDocument {
    constructor(segments) {
        super();
        this.type = TemplateDocument_1.TemplateSegmentTypes.SEGMENTED;
        this.segments = Promise.resolve(segments);
    }
}
exports.SegmentedDocument = SegmentedDocument;
//# sourceMappingURL=SegmentedDocument.js.map