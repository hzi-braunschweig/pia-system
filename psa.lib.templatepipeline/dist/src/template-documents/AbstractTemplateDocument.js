"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractTemplateDocument = void 0;
class AbstractTemplateDocument {
    pipe(pipeSection) {
        return pipeSection.execute(this);
    }
}
exports.AbstractTemplateDocument = AbstractTemplateDocument;
//# sourceMappingURL=AbstractTemplateDocument.js.map