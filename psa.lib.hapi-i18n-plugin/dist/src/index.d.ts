import { I18n, ConfigurationOptions } from 'i18n';
import { InternalRequestDefaults, PluginBase, PluginNameVersion, Server, Util } from '@hapi/hapi';
declare module '@hapi/hapi' {
    interface PluginsStates {
        i18n: I18n;
    }
}
export declare type HapiI18nPluginOptions = ConfigurationOptions;
export interface PluginReqRefDefaults extends InternalRequestDefaults {
    Headers: Util.Dictionary<string>;
}
export declare class HapiI18nPlugin implements PluginBase<HapiI18nPluginOptions>, PluginNameVersion {
    readonly name = "i18n";
    private readonly FIRST_LOCALE_CHARACTERS;
    private readonly iso639_1FallbackVariants;
    private supportedLocales;
    register(server: Server, options?: HapiI18nPluginOptions): void | Promise<void>;
    private getSupportedLocale;
    private determineBestLocaleFromRequest;
}
export declare const plugin: HapiI18nPlugin;
