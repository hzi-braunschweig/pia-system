## psa.server.auth

## Keycloak Admin console (only available on local development)

Access the admin console on https://pia-app/api/v1/auth/admin/ with username `admin` and pw being the value for authserver_admin_user.password in [internal-secrets.yaml](../k8s/deployment/overlays/local-k3d/internal-secrets.yaml).

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

## <a name="tos"></a> Terms of service and policy for user registration

If you want your users to accept terms of service and/or a policy you can set the environment variables with URLs, leading to those terms.

- `AUTHSERVER_PROBAND_TERMS_OF_SERVICE_URL`
- `AUTHSERVER_PROBAND_POLICY_URL`

As soon as one of these is set, a corresponding checkbox will appear during registration.

### Updating Terms of service or privacy policy

If you update the terms of service or the policy, you can run this [script](scripts/add-terms-and-conditions-action-to-users.sh) from within the k8s pod to add the TERMS_AND_CONDITIONS action to all users, so that each user must accept the terms and conditions and the privacy policy again.

```bash
bash add-terms-and-conditions-action-to-users.sh
```

## <a name="custom-email-themes"></a> Custom Email Themes with Kustomize

You can create custom email themes that inherit from the base PIA theme, allowing deployment-time customization of email messages without rebuilding Docker images.

### How It Works

This approach uses **Keycloak theme inheritance** with **direct ConfigMap mounting**:

- **Theme Inheritance**: Custom themes inherit from `pia` using `parent=pia` in `theme.properties`
- **Direct Mounting**: Theme files are mounted directly to `/opt/keycloak/themes/your-theme/`
- **Selective Override**: Only customize email messages; login styling and functionality are inherited
- **Native Keycloak**: Uses standard Keycloak theming patterns without runtime scripts

### Quick Start

1. **Create your theme files** in your overlay directory:

```
your-overlay/
├── kustomization.yaml
├── theme.properties
├── messages_en_US.properties
└── messages_de_DE.properties
```

2. **Configure direct mounting** in your `kustomization.yaml`:

```yaml
configMapGenerator:
  - name: my-study-theme
    options:
      disableNameSuffixHash: true
    files:
      - theme.properties
      - messages_en_US.properties
      - messages_de_DE.properties

patches:
  - target:
      kind: Deployment
      name: authserver
    patch: |-
      apiVersion: apps/v1
      kind: Deployment
      spec:
        template:
          spec:
            containers:
            - name: main
              volumeMounts:
              - name: my-study-theme
                mountPath: /opt/keycloak/themes/my-study-theme/email/theme.properties
                subPath: theme.properties
                readOnly: true
              - name: my-study-theme
                mountPath: /opt/keycloak/themes/my-study-theme/email/messages
                readOnly: true
              env:
              - name: EMAIL_THEME
                value: "my-study-theme"
            volumes:
            - name: my-study-theme
              configMap:
                name: my-study-theme
```

3. **Create your theme files**:

```properties
# theme.properties
parent=pia
locales=de-DE,de-CH,en-US,fr-FR,es-ES

# messages_en_US.properties
passwordResetSubject=My Study - Password Reset Request
passwordResetBody=Dear Study Participant,\n\nA password reset has been requested...
```
