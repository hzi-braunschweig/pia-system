# Configuration

PIA is designed to be configurable for different environments and use cases. These are the available configuration options:

| key                        | description                                                                                                | possible values             | required |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------- | -------- |
| `webappUrl`                | External URL which is used to access the application from the browser                                      | valid lower-case URL string | yes      |
| `externalProtocol`         | External protocol in use                                                                                   | `http` / `https`            | yes      |
| `externalHost`             | External host name of your PIA instance                                                                    | valid host name string      | yes      |
| `externalPort`             | External port (should only be none default behind a reverse proxy)                                         | valid port number           | yes      |
| `defaultLanguage`          | Code of default language to use app-wide                                                                   | `de-DE` / `de-CH` / `en-US` | yes      |
| `userPasswordLength`       | Minimum valid length of user passwords and length of generated one-time passwords                          | number                      | yes      |
| `probandTermsOfServiceUrl` | URL to the proband facing terms of service which will be displayed in the app                              | valid URL string            | yes      |
| `probandPolicyUrl`         | URL to the proband facing privacy policy which will be displayed in the app                                | valid URL string            | yes      |
| `mailServerHostName`       | Host name of the mail server used by PIA to send mails                                                     | valid host name string      | yes      |
| `mailServerPort`           | Port of the mail server used by PIA to send mails                                                          | valid port number           | yes      |
| `mailServerUserName`       | User name of the mail server user                                                                          | string                      | yes      |
| `mailServerPassword`       | Password of the mail server user                                                                           | string                      | yes      |
| `mailServerRequireTls`     | Does the mail server require a secure TLS connection?                                                      | `true` / `false`            | yes      |
| `mailServerFromAddress`    | Mail address used by PIA when sending mails (will be visible to users)                                     | valid mail address          | yes      |
| `mailServerFromName`       | Name used by PIA when sending mails (will be visible to users)                                             | string                      | yes      |
| `firebasePrivateKeyBase64` | Firebase credential private key, to send push notifications to users. Must be provided at least as a fake. | private key, base64 encoded | yes      |
| `firebaseProjectId`        | Firebase project id, to send push notifications to users. Must be provided at least as a fake.             | string                      | yes      |
| `firebaseClientEmail`      | Firebase client email, to send push notifications to users. Must be provided at least as a fake.           | string                      | yes      |
| `modysBaseUrl`             | Base URL of an external MODYS instance (if in use)                                                         | valid URL string            | no       |
| `modysUserName`            | Username for connecting to an external MODYS instance (if in use)                                          | string                      | no       |
| `modysPassword`            | Password for connecting to an external MODYS instance (if in use)                                          | string                      | no       |
| `modysStudy`               | Study which should be connected to an external MODYS instance (if in use)                                  | existing study name         | no       |
| `modysIdentifierTypeId`    | Identifier type id to be used to fetch participant data from external MODYS                                | number                      | no       |
| `modysRequestConcurrency`  | Count of maximum concurrend requests towards an external MODYS instance                                    | number                      | no       |

See the [deployment documentation](../docs/deployment.md#deploying-for-the-first-time) to learn more about how to actually set up the configuration.
