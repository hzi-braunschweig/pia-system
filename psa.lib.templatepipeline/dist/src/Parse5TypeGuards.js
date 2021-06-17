"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTextNode = exports.isElement = exports.isChildNode = exports.isParentNode = exports.isNode = void 0;
function isObject(instance) {
    return !!instance && typeof instance === 'object';
}
function isNode(instance) {
    if (!isObject(instance))
        return false;
    const node = instance;
    return typeof node.nodeName === 'string';
}
exports.isNode = isNode;
function isParentNode(instance) {
    if (!isNode(instance))
        return false;
    const node = instance;
    return typeof node.childNodes === 'object';
}
exports.isParentNode = isParentNode;
function isChildNode(instance) {
    if (!isNode(instance))
        return false;
    const node = instance;
    return typeof node.parentNode === 'object';
}
exports.isChildNode = isChildNode;
function isElement(instance) {
    if (!isParentNode(instance) || !isChildNode(instance))
        return false;
    const node = instance;
    return (typeof node.nodeName === 'string' &&
        typeof node.tagName === 'string' &&
        typeof node.namespaceURI === 'string' &&
        typeof node.attrs === 'object');
}
exports.isElement = isElement;
function isTextNode(instance) {
    if (!isChildNode(instance))
        return false;
    const node = instance;
    return node.nodeName === '#text' && typeof node.value === 'string';
}
exports.isTextNode = isTextNode;
//# sourceMappingURL=Parse5TypeGuards.js.map