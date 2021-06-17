const hashService = require('../../services/hashService');
const TemplateGenerationError = require('../errors/templateGenerationError');

const generateLaboratoryResultTableTemplate = (function () {
  return function (element) {
    let template =
      '<table class="pia-laboratory-result-table"><tr><th>PCR</th><th>Ergebnis</th><th>Analysis Datum</th><th>Eingang der Probe</th><th>Datum der Ergebnismitteilung</th></tr>';
    element.children.forEach((child) => {
      const nameAttribute = child.attributes.find(
        (attribute) => attribute.key === 'name'
      );

      if (!nameAttribute) {
        throw TemplateGenerationError(
          'name attribute is missing in one table entry'
        );
      }

      const nameHash = hashService.createMd5Hash(nameAttribute.value);

      template +=
        '{{#lab_observations.' +
        nameHash +
        '}}<tr>' +
        '<td>' +
        nameAttribute.value +
        '</td>' +
        '<td>{{lab_observations.' +
        nameHash +
        '.result}}</td>' +
        '<td>{{lab_observations.' +
        nameHash +
        '.date_of_analysis}}</td>' +
        '<td>{{lab_observations.' +
        nameHash +
        '.date_of_delivery}}</td>' +
        '<td>{{lab_observations.' +
        nameHash +
        '.date_of_announcement}}</td>' +
        '</tr>{{/lab_observations.' +
        nameHash +
        '}}';
    });
    template += '</table>';
    return template;
  };
})();

module.exports = generateLaboratoryResultTableTemplate;
