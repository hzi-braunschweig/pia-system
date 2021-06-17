/**
 * @description interactor that handles user requests based on users permissions
 */
const userSettingsInteractor = (function () {
  async function updateUserSettings(
    decodedToken,
    userName,
    userSettings,
    pgHelper
  ) {
    const userRole = decodedToken.role;
    const username = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        if (userName !== username)
          throw new Error("decodedToken name and request name don't match");
        else {
          return pgHelper
            .updateUserSettings(userName, userSettings)
            .catch((err) => {
              console.log(err);
              throw new Error('Could not update user settings: ' + err);
            });
        }
      default:
        throw new Error('Could not update user settings: wrong role ');
    }
  }

  async function getUserSettings(decodedToken, userName, pgHelper) {
    const userRole = decodedToken.role;
    const username = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        if (userName !== username)
          throw new Error("decodedToken name and request name don't match");
        else {
          return pgHelper.getUserSettings(userName).catch((err) => {
            console.log(err);
            throw new Error('Could not get user settings: ' + err);
          });
        }
      default:
        throw new Error('Could not get user settings: wrong role');
    }
  }

  return {
    /**
     * @function
     * @description updates the user's settings
     * @memberof module:userSettingsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} userSettings the user settings to update
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateUserSettings: updateUserSettings,

    /**
     * @function
     * @description updates the user's settings
     * @memberof module:userSettingsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getUserSettings: getUserSettings,
  };
})();

module.exports = userSettingsInteractor;
