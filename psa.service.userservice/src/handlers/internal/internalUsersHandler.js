const Boom = require('@hapi/boom');
const internalUsersInteractor = require('../../interactors/internal/internalUsersInteractor');

/**
 * @description Internal handler for users
 */
const internalUsersHandler = (function () {
  async function deleteProbandData(request) {
    return internalUsersInteractor
      .deleteProbandData(request.params.username, request.query.keepUsageData)
      .catch((err) => {
        request.log(['error'], 'Could not delete user from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  async function lookupIds(request) {
    return internalUsersInteractor
      .lookupIds(request.params.username)
      .catch((err) => {
        request.log(['error'], 'Could not find user in DB: ' + err);
        throw Boom.notFound(err);
      });
  }

  async function lookupMappingId(request) {
    return internalUsersInteractor
      .lookupMappingId(request.params.username)
      .catch((err) => {
        request.log(
          ['error'],
          'Could not find user in DB lookupMappingId: ' + err
        );
        throw Boom.notFound(err);
      });
  }

  async function getPrimaryStudy(request) {
    return await internalUsersInteractor
      .getPrimaryStudyOfProband(request.params.username)
      .catch((err) => {
        request.log(
          ['error'],
          'Could not find user in getPrimaryStudy: ' + err
        );
        throw Boom.notFound(err);
      });
  }

  async function getProbandsWithAcessToFromProfessional(request) {
    return await internalUsersInteractor.getProbandsWithAcessToFromProfessional(
      request.params.username
    );
  }

  async function getProband(request) {
    return await internalUsersInteractor.getProband(request.params.username);
  }

  async function getStudiesForProfessional(request) {
    return await internalUsersInteractor.getStudiesForProfessional(
      request.params.username
    );
  }

  async function getPseudonyms(request) {
    return internalUsersInteractor
      .getPseudonyms(request.query.study, request.query.accountStatus)
      .catch((err) => {
        console.warn('getPseudonyms', err);
        return Boom.boomify(err);
      });
  }

  return {
    /**
     * @function
     * @description looks up ids of user
     * @memberof module:internalUsersHandler
     */
    lookupIds: lookupIds,

    /**
     * @function
     * @description deletes the user and all its data if the user is allowed to
     * @memberof module:internalUsersHandler
     */
    deleteProbandData: deleteProbandData,

    lookupMappingId: lookupMappingId,

    getPrimaryStudy: getPrimaryStudy,

    getProbandsWithAcessToFromProfessional:
      getProbandsWithAcessToFromProfessional,

    getProband: getProband,

    getStudiesForProfessional: getStudiesForProfessional,

    getPseudonyms: getPseudonyms,
  };
})();

module.exports = internalUsersHandler;
