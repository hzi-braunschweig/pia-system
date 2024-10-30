#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const commander_1 = require("commander");
const licenseCollector_1 = require("./licenseCollector");
const dockerLicenseTexts_1 = require("./dockerLicenseTexts");
const additionalLicenseTexts_1 = require("./additionalLicenseTexts");
const asyncWithErrors_1 = require("./asyncWithErrors");
class Program {
    static async main() {
        const program = new commander_1.Command();
        program
            .description('Creating files with license information')
            .addOption(new commander_1.Option('-t, --target <target>', 'The path where to save the licenses').default('./THIRD_PARTY_LICENSES'))
            .addOption(new commander_1.Option('-e, --excludePackages <excludePackages>', "You can specify a list of packages separated by ';'"))
            .addOption(new commander_1.Option('-p, --onlyProduction', 'Use this option, if you only want to include production dependencies'))
            .addOption(new commander_1.Option('-a, --assertValidLicenseTexts', 'Use this option, if you want the license collector also to check that ' +
            "every license has a valid license text - the job fails if it doesn't"))
            .addOption(new commander_1.Option('-f, --format <format>', 'Select whether to get a json or plain text output')
            .choices(['json', 'text'])
            .default('text'))
            .addOption(new commander_1.Option('-d, --addDocker', 'Add additional Docker licenses stored fix in this lib'))
            .addArgument(new commander_1.Argument('[root]', 'Set the root directory, that should be scanned').default('./', 'current directory'))
            .action((0, asyncWithErrors_1.asyncPassErrors)(async (root, options) => {
            const licenses = await licenseCollector_1.LicenseCollector.collectLicenses(root, options.excludePackages, options.onlyProduction, options.assertValidLicenseTexts);
            if (options.addDocker) {
                licenses.push(...(0, dockerLicenseTexts_1.getDockerLicenses)());
            }
            licenses.push(...(0, additionalLicenseTexts_1.getAdditionalLicenses)());
            licenses.sort((a, b) => {
                return a.packageName === b.packageName
                    ? 0
                    : a.packageName > b.packageName
                        ? 1
                        : -1;
            });
            switch (options.format) {
                case 'text':
                    await promises_1.default.writeFile(options.target, this.createLicenseTextFile(licenses));
                    break;
                case 'json':
                    await promises_1.default.writeFile(options.target, JSON.stringify({ licenses }));
                    break;
            }
        }));
        await program.parseAsync();
    }
    static createLicenseTextFile(licenses) {
        let thirdPartyLicenses = '';
        for (const license of licenses) {
            const repo = license.repository ? ' [' + license.repository + ']' : '';
            thirdPartyLicenses +=
                '################################################################################\n' +
                    `# ${license.packageName} (${license.licenses.toString()})${repo}\n` +
                    '################################################################################\n\n' +
                    `${this.removeCarriageReturns(license.licenseText)}` +
                    '\n\n';
        }
        return thirdPartyLicenses;
    }
    static removeCarriageReturns(licenseText) {
        return licenseText.replace(/\r/g, '');
    }
}
void Program.main();
//# sourceMappingURL=cli.js.map