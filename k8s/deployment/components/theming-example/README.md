# Theming Example Component

This component provides an example of how to customize the PIA application theming, specifically for Keycloak email templates.

## What it does

- Creates a ConfigMap with custom theme files
- Mounts theme files into the Keycloak container
- Sets the EMAIL_THEME environment variable to use the custom theme

## Files included

- `theme.properties` - Main theme configuration
- `messages_de_DE.properties` - changed German message translations
- `messages_de_CH.properties` - changed Swiss message translations

## How to use

1. **Enable the component** in your kustomization.yaml:

   ```yaml
   components:
     - ../../components/theming-example # Add this line
   ```
