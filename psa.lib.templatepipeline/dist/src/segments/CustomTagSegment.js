"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTagSegment = void 0;
const TemplateSegment_1 = require("./TemplateSegment");
class CustomTagSegment {
    constructor(tagName, attrs = [], children = []) {
        this.type = TemplateSegment_1.SegmentType.CUSTOM_TAG;
        this.attrs = [];
        this.children = [];
        this.tagName = tagName;
        this.attrs = attrs;
        this.children = children;
    }
}
exports.CustomTagSegment = CustomTagSegment;
//# sourceMappingURL=CustomTagSegment.js.map