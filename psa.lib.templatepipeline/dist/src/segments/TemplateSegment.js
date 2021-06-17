"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTemplateSegment = exports.SegmentType = void 0;
var SegmentType;
(function (SegmentType) {
    SegmentType["HTML"] = "HTML";
    SegmentType["CUSTOM_TAG"] = "CUSTOM_TAG";
})(SegmentType = exports.SegmentType || (exports.SegmentType = {}));
function isObject(instance) {
    return !!instance && typeof instance === 'object';
}
function isTemplateSegment(instance) {
    if (!isObject(instance))
        return false;
    const segment = instance;
    return (segment.type === SegmentType.HTML || segment.type === SegmentType.CUSTOM_TAG);
}
exports.isTemplateSegment = isTemplateSegment;
//# sourceMappingURL=TemplateSegment.js.map