# psa.lib.publicapi

Provides types with `tsoa` documentation and annotations, which are agnostic to the specialist domain of a service.

New types added to this library should:

- be used for generating the OpenAPI document
- contain an `@exmaple` annotation
- not be specific to the service you are currently working on

This library can also contain shared type guards, utilities and more, as long as they need to be reused across
multiple services in context of implementing a public API.

> Please check if the thing you want to add to this library is not already available in `psa.lib.service-core`.
