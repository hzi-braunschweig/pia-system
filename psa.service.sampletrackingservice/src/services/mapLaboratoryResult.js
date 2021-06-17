const hashService = require('./hashService');
const format = require('date-fns/format');

const mapLaboratoryResult = (function () {
  const dateFormat = 'dd.MM.yyyy, H:mm';

  const statusTranslations = {
    analyzed: 'Analysiert',
    new: 'Neu',
    sampled: 'Unterwegs zum Labor',
  };

  /**
   * Returns an ISO Date as readable date string
   *
   * @example
   * 2018-05-03T00:00:00.000Z => 03.05.2018, 2:00
   *
   * @param isoDate
   */
  function formatDate(isoDate) {
    if (!isoDate) {
      return null;
    }
    return format(new Date(isoDate), dateFormat);
  }

  /**
   * Converts the list of observations into an object who's keys
   * are the hashed names and the values are the translation of the
   * result.
   *
   * @param observations
   * @returns {any}
   */
  function convertObservationsToKeyValueObject(observations) {
    return Object.fromEntries(
      observations.map((observation) => mapObservationToKeyValue(observation))
    );
  }

  function mapObservationToKeyValue(observation) {
    return [
      hashService.createMd5Hash(observation.name), // Enables the name to be a string of any character
      {
        name: observation.name,
        result: observation.result_string,
        date_of_analysis: formatDate(observation.date_of_analysis),
        date_of_delivery: formatDate(observation.date_of_delivery),
        date_of_announcement: formatDate(observation.date_of_announcement),
      },
    ];
  }

  /**
   * Maps a lab result to a template specific representation
   * @param labResult
   * @returns {{status: *}}
   */
  return function (labResult) {
    return {
      ...labResult,
      date_of_sampling: formatDate(labResult.date_of_sampling),
      status: statusTranslations[labResult.status],
      lab_observations: convertObservationsToKeyValueObject(
        labResult.lab_observations || []
      ),
    };
  };
})();

module.exports = mapLaboratoryResult;
