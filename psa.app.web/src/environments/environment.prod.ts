export const environment = {
  production: true,
  defaultLanguage: '${DEFAULT_LANGUAGE}',
  matomoUrl: '${MATOMO_URL}',
  isSormasEnabled:
    '${IS_SORMAS_ENABLED}' && '${IS_SORMAS_ENABLED}'.toLowerCase() !== 'false',
  isDevelopmentSystem:
    '${IS_DEVELOPMENT_SYSTEM}' &&
    '${IS_DEVELOPMENT_SYSTEM}'.toLowerCase() !== 'false',
};
