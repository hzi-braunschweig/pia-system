"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlSegment = void 0;
const TemplateSegment_1 = require("./TemplateSegment");
class HtmlSegment {
    constructor(html) {
        this.type = TemplateSegment_1.SegmentType.HTML;
        this.html = html;
    }
}
exports.HtmlSegment = HtmlSegment;
//# sourceMappingURL=HtmlSegment.js.map