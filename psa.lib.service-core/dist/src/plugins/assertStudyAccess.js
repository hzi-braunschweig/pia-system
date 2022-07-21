"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertStudyAccess = void 0;
const assertStudyAccess_1 = require("../auth/assertStudyAccess");
exports.AssertStudyAccess = {
    name: 'assert-study-access',
    version: '1.0.0',
    register: function (server) {
        const studyPathParamName = 'studyName';
        server.ext('onPreHandler', (r, h) => {
            const isActive = r.route.settings.app?.assertStudyAccess;
            if (isActive) {
                const decodedToken = r.auth.credentials;
                const studyName = r.params[studyPathParamName];
                try {
                    (0, assertStudyAccess_1.assertStudyAccess)(studyName, decodedToken);
                }
                catch (error) {
                    return error;
                }
            }
            return h.continue;
        });
    },
};
//# sourceMappingURL=assertStudyAccess.js.map