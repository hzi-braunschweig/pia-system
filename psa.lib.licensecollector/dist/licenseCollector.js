"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseCollector = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const util = __importStar(require("util"));
const license_checker_1 = require("license-checker");
const packageLicense_1 = require("./packageLicense");
const licenseTextCompleter_1 = require("./licenseTextCompleter");
const getLicenses = util.promisify(license_checker_1.init);
class LicenseCollector {
    static async collectLicenses(rootDir, excludePackages, onlyProduction, assertValidLicenseTexts = false) {
        await licenseTextCompleter_1.LicenseTextCompleter.init();
        const modulePathsAsync = LicenseCollector.getModulePathsIn(path_1.default.resolve(rootDir));
        const modulePaths = [];
        const ownPackages = [];
        for await (const modulePath of modulePathsAsync) {
            const packageName = await LicenseCollector.getOwnName(modulePath);
            ownPackages.push(packageName);
            modulePaths.push(modulePath);
        }
        const moduleInfosList = [];
        for (const modulePath of modulePaths) {
            try {
                const moduleInfos = await getLicenses({
                    start: modulePath,
                    production: onlyProduction,
                    excludePackages: [...ownPackages, excludePackages].join(';'),
                    onlyAllow: (onlyProduction
                        ? this.LICENSE_WHITELIST_PROD
                        : this.LICENSE_WHITELIST_PROD_AND_DEV).join(';'),
                    customFormat: {
                        name: '',
                        repository: undefined,
                        licenses: '',
                        licenseText: packageLicense_1.PackageLicense.EMPTY_LICENSE_TEXT_PLACEHOLDER,
                    },
                });
                moduleInfosList.push(moduleInfos);
            }
            catch (err) {
                if (err instanceof Error) {
                    if (err.message === 'No packages found in this path..') {
                        console.log(`There was a package.json in '${modulePath}' but no packages where found in this path.`);
                    }
                    else if (err.message.includes('--onlyAllow')) {
                        throw new Error(err.toString());
                    }
                    else {
                        console.error(err);
                    }
                }
                else {
                    console.error(err);
                }
            }
        }
        const allLicenses = new Map();
        moduleInfosList.forEach((moduleInfos) => {
            const licenses = LicenseCollector.getLicenseEntries(moduleInfos);
            if (assertValidLicenseTexts) {
                licenses.forEach((license) => {
                    license.assertLicenseTextIsValid();
                });
            }
            licenses.forEach((license) => {
                allLicenses.set(license.getHash(), license);
            });
        });
        return [...allLicenses.values()];
    }
    static async getOwnName(rootPath) {
        const packageInfos = JSON.parse(await promises_1.default.readFile(path_1.default.join(rootPath, 'package.json'), {
            encoding: 'utf-8',
        }));
        return packageInfos.name + '@' + packageInfos.version;
    }
    static async *getModulePathsIn(rootPath) {
        const dirEntries = await promises_1.default.readdir(rootPath, { withFileTypes: true });
        for (const entry of dirEntries) {
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                yield* this.getModulePathsIn(path_1.default.join(rootPath, entry.name));
            }
            else if (entry.isFile() && entry.name === 'package.json') {
                yield rootPath;
            }
        }
    }
    static getLicenseEntries(licenseCheckerJson) {
        return Object.values(licenseCheckerJson).map((entry) => {
            if (!(entry.name && entry.licenses && entry.licenseText)) {
                throw new Error('Module is missing some entries' + JSON.stringify(entry));
            }
            return new packageLicense_1.PackageLicense(entry.name, entry.licenses, entry.licenseText, entry.repository);
        });
    }
}
exports.LicenseCollector = LicenseCollector;
LicenseCollector.LICENSE_WHITELIST_PROD = [
    '0BSD',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'BSD',
    'CC-BY-3.0',
    'CC-BY-4.0',
    'CC0-1.0',
    'EPL-2.0',
    'ISC',
    'MIT',
    'MPL-2.0',
    'Unlicense',
    'WTFPL',
];
LicenseCollector.LICENSE_WHITELIST_PROD_AND_DEV = [
    ...LicenseCollector.LICENSE_WHITELIST_PROD,
    'Apache 2.0',
    'CC-BY-4.0',
    'Custom',
    'EUPL-1.1',
    'Python-2.0',
    'Artistic-2.0',
];
//# sourceMappingURL=licenseCollector.js.map