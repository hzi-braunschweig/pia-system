## psa.server.auth

## Themes

Current themes in use are in [themes/](themes/).

If you want to start working on themes locally, follow these steps:

1. **Temporarily** extend `scripts/start-keycloak.sh` with the following parameters, to disable theme caching and
   update your container:

```
--spi-theme-static-max-age=-1 --spi-theme-cache-themes=false --spi-theme-cache-templates=false
```

2. Compile the theme and copy it into your running container:

```bash
npm run theme:build-local
```

3. See the official keycloak [README.md](themes/README.md) to get started creating themes

## Adding a language to keycloak

1. Add the new language key to `supportedLocales` in all realms in `realms/*.json`.
2. Add the new language key to `locales` in each file in `themes/pia/*/theme.properties` - e.g. `es-ES`.
3. Add the corresponding translation file to each `themes/pia/*/messages/` - e.g. `messages_es_ES.properties`.
   Note that the **dash** must be **replaced with an underscore**.

As language keys are inherited from the used parent theme, you must copy all necessary language keys from the parent theme to your
new language file. Also check, whether the parent theme PIA is using, is also using a parent theme. In that case, you
might have to merge all inherited language files into your new language file, to get all keys from all parent themes.

The parent theme is defined in each `themes/pia/*/theme.properties` file, anf can vary every time.

## Terms of services and policy for user registration

If you want your users to accept terms of services and/or a policy you can set the environment variables with URLs, leading to those terms.

- `AUTHSERVER_PROBAND_TERMS_OF_SERVICE_URL`
- `AUTHSERVER_PROBAND_POLICY_URL`

As soon as one of these is set, a corresponding checkbox will appear during registration.
