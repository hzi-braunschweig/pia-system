"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.HapiI18nPlugin = void 0;
const i18n_1 = require("i18n");
const accept_1 = __importDefault(require("@hapi/accept"));
class HapiI18nPlugin {
    constructor() {
        this.name = 'i18n';
        this.FIRST_LOCALE_CHARACTERS = 2;
        this.iso639_1FallbackVariants = new Map([
            ['en', 'en-US'],
            ['de', 'de-DE'],
        ]);
        this.supportedLocales = [];
    }
    register(server, options = {}) {
        if (!options.locales?.length) {
            throw Error('No locales defined!');
        }
        const pluginOptions = {
            updateFiles: false,
            ...options,
            defaultLocale: options.defaultLocale ?? options.locales[0],
            locales: options.locales,
        };
        this.supportedLocales = pluginOptions.locales;
        server.ext('onPreHandler', (request, h) => {
            const i18n = new i18n_1.I18n();
            i18n.configure(pluginOptions);
            const locale = this.determineBestLocaleFromRequest(request) ??
                pluginOptions.defaultLocale;
            i18n.setLocale(locale);
            request.plugins.i18n = i18n;
            return h.continue;
        });
    }
    getSupportedLocale(locale) {
        if (!locale) {
            return undefined;
        }
        return this.supportedLocales.find((supportedLocale) => supportedLocale.toLowerCase() === locale.toLowerCase());
    }
    determineBestLocaleFromRequest(request) {
        const tokenLocale = request.auth?.credentials?.['locale'];
        let bestMatch = this.getSupportedLocale(tokenLocale);
        if (bestMatch)
            return bestMatch;
        const acceptLocales = accept_1.default.languages(request.headers['accept-language']);
        for (const acceptLocale of acceptLocales) {
            bestMatch = this.getSupportedLocale(acceptLocale);
            if (bestMatch)
                return bestMatch;
            const fallbackVariant = this.iso639_1FallbackVariants.get(acceptLocale.substring(0, this.FIRST_LOCALE_CHARACTERS));
            bestMatch = this.getSupportedLocale(fallbackVariant);
            if (bestMatch)
                return bestMatch;
        }
        return undefined;
    }
}
exports.HapiI18nPlugin = HapiI18nPlugin;
exports.plugin = new HapiI18nPlugin();
//# sourceMappingURL=index.js.map