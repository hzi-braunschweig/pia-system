const supportedLocales = [
  'de-DE',
  'de-CH',
  'en-US',
  'fr-CH',
  'fr-FR',
  'it-CH',
  'it-IT',
];

exports.isLocaleSupported = function (locale) {
  return supportedLocales.includes(locale);
};

exports.fallbackLocale = 'en-US';
