#!/bin/bash

#
# SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

LOGO_FILE_NAME="logo.jpeg"

# Check if a file path was provided
if [ -z "$1" ]
then
    echo "Please provide a file path as an argument."
    exit 1
fi

# File path
FILE_PATH=$1

# Ask the user to enter the actual values for the placeholders
echo
echo "You are going to create a deployment overlay for your specific environment."
echo "Please configure it to your needs by entering the following values:"
echo
read -p "Name of your deployment (e.g. my-org-prod): " deploymentName
read -p "Kubernetes namespace of your deployment (e.g. pia): " namespace
read -p "Docker registry path (valid url): " dockerRegistryPath
read -p "Docker image tag (e.g. 1.36.0): " dockerImageTag
read -p "External URL which is used to access the application from the browser (valid url): " webappUrl
read -p "External protocol in use (https|http): " externalProtocol
read -p "External host name of your PIA instance: " externalHost
read -p "External port (should only be none default [443] behind a reverse proxy): " externalPort
read -p "Code of default language to use app-wide (de-DE|de-CH|en-US): " defaultLanguage
read -p "Minimum valid length of user passwords and length of generated one-time passwords (number): " userPasswordLength
read -p "URL to the proband facing terms of service which will be displayed in the app: " probandTermsOfServiceUrl
read -p "URL to the proband facing privacy policy which will be displayed in the app: " probandPolicyUrl
read -p "Host name of the mail server used by PIA to send mails: " mailServerHostName
read -p "Port of the mail server used by PIA to send mails: " mailServerPort
read -p "User name of the mail server user: " mailServerUserName
read -p "Password of the mail server user: " mailServerPassword
read -p "Does the mail server require a secure TLS connection? (true|false): " mailServerRequireTls
read -p "Mail address used by PIA when sending mails (will be visible to users): " mailServerFromAddress
read -p "Name used by PIA when sending mails (will be visible to users): " mailServerFromName

read -p "Provide file path to a JPEG image to use as a logo (max. 100 KB) (leave empty to skip): " customizeLogoFilePath
while [[ "$customizeLogoFilePath" != "" && ! -f $customizeLogoFilePath ]]; do
    read -p "The file path provided does not exist. Please provide a valid file path or leave empty to skip:"
done

printf "%60s" " " | tr ' ' '-' && echo
echo "ℹ️Please provide Firebase credentials from your credential.json to send push notifications to users."
echo "Copy and paste the private key from you credential.json without quotes:"
firebasePrivateKey=""
while IFS= read -r line
do
    [[ "$line" == "" ]] && break
    firebasePrivateKey+="$line"$"\n"
done
read -p "Firebase project ID: " firebaseProjectId
read -p "Firebase client email: " firebaseClientEmail

# Remove trailing slash from the docker registry path
dockerRegistryPath=$(echo "$dockerRegistryPath" | sed 's#/$##')

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read the kustomization.yaml template from the file
KUSTOMIZATION_TEMPLATE=$(cat "$SCRIPT_DIR/overlay-template.yaml")

# Write the Firebase private key to a temporary file and encode it to base64 and preserve linebreaks
echo -en $firebasePrivateKey > tmp_fb_pkey.txt
cat tmp_fb_pkey.txt | base64 > tmp_fb_pkey_b64.txt
rm tmp_fb_pkey.txt

# Customize logo
customizeLogo=""
componentCustomizeLogo=""
configMapGenerator=""

if [[ -n "$customizeLogoFilePath" ]]
then
    customizeLogoComponent="  - ../../components/customize-logo \# Remove, if you want to use the original HZI logo again"
    configMapGenerator="configMapGenerator:\n  - name: pia-logo\n    files:\n      - ./${LOGO_FILE_NAME}\n      - ./${LOGO_FILE_NAME}.gz\n"
fi

# Replace the placeholders with the actual values in the kustomization.yaml template
echo "$KUSTOMIZATION_TEMPLATE" | sed -e "s#{deploymentName}#$deploymentName#g" \
    -e "s#{customizeLogoComponent}#$customizeLogoComponent#g" \
    -e "s#{configMapGenerator}#$configMapGenerator#g" \
    -e "s#{namespace}#$namespace#g" \
    -e "s#{dockerRegistryPath}#$dockerRegistryPath#g" \
    -e "s#{dockerImageTag}#$dockerImageTag#g" \
    -e "s#{webappUrl}#$webappUrl#g" \
    -e "s#{externalProtocol}#$externalProtocol#g" \
    -e "s#{externalHost}#$externalHost#g" \
    -e "s#{externalPort}#$externalPort#g" \
    -e "s#{defaultLanguage}#$defaultLanguage#g" \
    -e "s#{userPasswordLength}#$userPasswordLength#g" \
    -e "s#{probandTermsOfServiceUrl}#$probandTermsOfServiceUrl#g" \
    -e "s#{probandPolicyUrl}#$probandPolicyUrl#g" \
    -e "s#{mailServerHostName}#$mailServerHostName#g" \
    -e "s#{mailServerPort}#$mailServerPort#g" \
    -e "s#{mailServerUserName}#$mailServerUserName#g" \
    -e "s#{mailServerPassword}#$mailServerPassword#g" \
    -e "s#{mailServerRequireTls}#$mailServerRequireTls#g" \
    -e "s#{mailServerFromAddress}#$mailServerFromAddress#g" \
    -e "s#{mailServerFromName}#$mailServerFromName#g" \
    -e "s#{firebasePrivateKeyBase64}#$(cat tmp_fb_pkey_b64.txt)#g" \
    -e "s#{firebaseProjectId}#$firebaseProjectId#g" \
    -e "s#{firebaseClientEmail}#$firebaseClientEmail#g" > $FILE_PATH/kustomization.yaml || { echo "Failed to write to $FILE_PATH/kustomization.yaml"; exit 1; }

# Cleanup the temporary private key file
rm tmp_fb_pkey_b64.txt;

# Copy logo to the overlays directory
if [[ -n "$customizeLogoFilePath" ]]
then
    cp $customizeLogoFilePath $FILE_PATH/${LOGO_FILE_NAME}

    echo "🖼 Logo was copied from: ${customizeLogoFilePath} to: $FILE_PATH/${LOGO_FILE_NAME}"

    # Create compression version of logo if possible
    if [ -x "$(command -v gzip)" ]
    then
        gzip < $FILE_PATH/${LOGO_FILE_NAME} > $FILE_PATH/${LOGO_FILE_NAME}.gz
        echo "🗜 Created compression version of logo file $FILE_PATH/${LOGO_FILE_NAME}.gz"
    else
        echo "🚨 Please make sure to create a gzip compressed version of the logo file, named '${LOGO_FILE_NAME}.gz' before deployment."
    fi
fi
echo ""
echo "🥳 Your custom overlay has been written to $FILE_PATH/kustomization.yaml"
echo "📋 Please check its content before deployment."