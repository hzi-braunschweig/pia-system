const { CustomTagConverter } = require('@pia/lib-templatepipeline');

class PiaConsentSwitchRadio extends CustomTagConverter {
  constructor() {
    super();
  }

  createSwitchCase(caseNodes, value) {
    const wrapper = {
      nodeName: 'div',
      tagName: 'div',
      attrs: [],
      childNodes: [],
      parentNode: null,
    };
    caseNodes
      .filter((aCase) => aCase.nodeName === 'pia-case')
      .forEach((aCase) => {
        const valueAttr = aCase.attrs.find((attr) => attr.name === 'value');
        const isCaseTrue = valueAttr && valueAttr.value === 'true';
        wrapper.childNodes.push({
          nodeName: '#text',
          value: isCaseTrue ? `{{#${value}}}` : `{{^${value}}}`,
          parentNode: wrapper,
        });
        aCase.childNodes.forEach((child) => (child.parentNode = wrapper));
        wrapper.childNodes.push(...aCase.childNodes);
        wrapper.childNodes.push({
          nodeName: '#text',
          value: `{{/${value}}}`,
          parentNode: wrapper,
        });
      });
    return wrapper;
  }
}

module.exports = PiaConsentSwitchRadio;
