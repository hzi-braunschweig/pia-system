"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomSegmenter = void 0;
const parse5_1 = require("parse5");
const TemplateSegment_1 = require("../segments/TemplateSegment");
const Parse5TypeGuards_1 = require("../Parse5TypeGuards");
const template_documents_1 = require("../template-documents");
const segments_1 = require("../segments");
class DomSegmenter {
    execute(input) {
        return new template_documents_1.SegmentedDocument(this.segmentDocument(input.dom));
    }
    async segmentDocument(dom) {
        return this.segmentParentNode(await dom);
    }
    segmentParentNode(parent) {
        const segments = [];
        for (const child of parent.childNodes) {
            const newSegmentS = this.convertChildToSegmentS(child);
            if (newSegmentS === null) {
            }
            else if ((0, TemplateSegment_1.isTemplateSegment)(newSegmentS)) {
                segments.push(newSegmentS);
            }
            else {
                newSegmentS.forEach((segment) => segments.push(segment));
            }
        }
        return segments;
    }
    convertChildToSegmentS(child) {
        if ((0, Parse5TypeGuards_1.isElement)(child) && child.tagName === 'p') {
            const sections = [];
            let i = 0;
            child.childNodes.forEach((pChild) => {
                if ((0, Parse5TypeGuards_1.isElement)(pChild) && this.isCustomHtmlTag(pChild.tagName)) {
                    if (!(sections.length === 0 && i === 0)) {
                        i++;
                    }
                    sections[i] = pChild;
                    i++;
                }
                else {
                    if (!sections[i]) {
                        sections[i] = [];
                    }
                    sections[i].push(pChild);
                }
            });
            return sections.map((section) => {
                if (Array.isArray(section)) {
                    const pCopy = {
                        ...child,
                    };
                    pCopy.childNodes = section.map((node) => ({
                        ...node,
                        parentNode: pCopy,
                    }));
                    return this.createHtmlSegment(pCopy);
                }
                else {
                    return this.createCustomTagSegment(section);
                }
            });
        }
        else if ((0, Parse5TypeGuards_1.isElement)(child) && this.isCustomHtmlTag(child.tagName)) {
            return this.createCustomTagSegment(child);
        }
        else if ((0, Parse5TypeGuards_1.isTextNode)(child) && child.value === '\n') {
            return null;
        }
        else {
            return this.createHtmlSegment(child);
        }
    }
    createHtmlSegment(child) {
        return new segments_1.HtmlSegment((0, parse5_1.serialize)({
            nodeName: '#document-fragment',
            childNodes: [child],
        }));
    }
    createCustomTagSegment(child) {
        const attrs = child.attrs.map((attr) => {
            const attrCopy = { name: attr.name, value: attr.value };
            return attrCopy;
        });
        const children = this.segmentParentNode(child);
        return new segments_1.CustomTagSegment(child.tagName, attrs, children);
    }
    isCustomHtmlTag(nodeName) {
        return (!/^[A-Za-z][A-Za-z0-9]*$/.exec(nodeName) &&
            !!/^[A-Za-z]([A-Za-z0-9-]*[A-Za-z0-9])?$/.exec(nodeName));
    }
}
exports.DomSegmenter = DomSegmenter;
//# sourceMappingURL=DomSegmenter.js.map