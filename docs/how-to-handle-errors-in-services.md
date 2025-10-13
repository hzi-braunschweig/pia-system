# How to handle errors in a service

In a service, we want to handle errors in a consistent way. This is important for the user experience and for debugging.
Messages from the service should be logged and the user should be informed about the error. Therefore,
we need errors that can be handled and translated to a user-friendly message.

The service-core library provides a custom ErrorHandler plugin for Hapi which will automatically be registered using the
[`registerPlugins`-method](../psa.lib.service-core/src/plugins/registerPlugins.ts) in the service.

This way, any [SpecificError](../psa.lib.service-core/src/plugins/errorHandler.ts) thrown by the service will be handled.
A specific Error has two important properties:

- `errorCode`: a unique identifier for the error that can be used to create a user-friendly message
- `message`: a human-readable message in english describing the error meant for debugging

The ErrorHandler plugin will automatically log the error and send a Boom response with the error code and message to the client.
