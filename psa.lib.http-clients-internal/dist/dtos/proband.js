"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbandOrigin = exports.ProbandStatus = exports.AccountStatus = void 0;
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACCOUNT"] = "account";
    AccountStatus["NO_ACCOUNT"] = "no_account";
})(AccountStatus = exports.AccountStatus || (exports.AccountStatus = {}));
var ProbandStatus;
(function (ProbandStatus) {
    ProbandStatus["ACTIVE"] = "active";
    ProbandStatus["DEACTIVATED"] = "deactivated";
    ProbandStatus["DELETED"] = "deleted";
})(ProbandStatus = exports.ProbandStatus || (exports.ProbandStatus = {}));
var ProbandOrigin;
(function (ProbandOrigin) {
    ProbandOrigin["SELF"] = "self";
    ProbandOrigin["INVESTIGATOR"] = "investigator";
    ProbandOrigin["SORMAS"] = "sormas";
})(ProbandOrigin = exports.ProbandOrigin || (exports.ProbandOrigin = {}));
//# sourceMappingURL=proband.js.map