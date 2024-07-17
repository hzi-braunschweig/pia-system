// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ParticipantController } from './controllers/public/participantController';
import { hapiAuthentication } from './auth';
// @ts-ignore - no great way to install types from subpackage
const promiseAny = require('promise.any');
import { boomify, isBoom, type Payload } from '@hapi/boom';
import type { Request, RouteOptionsPreAllOptions } from '@hapi/hapi';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Pseudonym": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^[a-z0-9]+-[0-9]+$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantStatus": {
        "dataType": "refEnum",
        "enums": ["active","deactivated","deleted"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AccountStatus": {
        "dataType": "refEnum",
        "enums": ["account","no_account"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantDto": {
        "dataType": "refObject",
        "properties": {
            "pseudonym": {"ref":"Pseudonym","required":true},
            "ids": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "study": {"dataType":"string","required":true},
            "status": {"ref":"ParticipantStatus","required":true},
            "accountStatus": {"ref":"AccountStatus","required":true},
            "studyCenter": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "examinationWave": {"dataType":"union","subSchemas":[{"dataType":"integer"},{"dataType":"enum","enums":[null]}],"required":true},
            "isTestParticipant": {"dataType":"boolean","required":true},
            "firstLoggedInAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "deactivatedAt": {"dataType":"datetime","required":true},
            "deletedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantNotFoundError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_ParticipantDto.pseudonym_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pseudonym":{"ref":"Pseudonym","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateParticipantResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Pick_ParticipantDto.pseudonym_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"password":{"dataType":"string","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudyNotFoundError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PseudonymAlreadyExistsError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AccountCreateError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantSaveError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_Pick_ParticipantDto.-or-pseudonym-or-ids-or-studyCenter-or-examinationWave-or-isTestParticipant__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pseudonym":{"ref":"Pseudonym"},"ids":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"studyCenter":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"examinationWave":{"dataType":"union","subSchemas":[{"dataType":"integer"},{"dataType":"enum","enums":[null]}]},"isTestParticipant":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateParticipantRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"Partial_Pick_ParticipantDto.-or-pseudonym-or-ids-or-studyCenter-or-examinationWave-or-isTestParticipant__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_Pick_ParticipantDto.ids-or-studyCenter-or-examinationWave-or-isTestParticipant__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ids":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"studyCenter":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"examinationWave":{"dataType":"union","subSchemas":[{"dataType":"integer"},{"dataType":"enum","enums":[null]}]},"isTestParticipant":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PatchParticipantRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"Partial_Pick_ParticipantDto.ids-or-studyCenter-or-examinationWave-or-isTestParticipant__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantDeletionType": {
        "dataType": "refEnum",
        "enums": ["default","full"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(server: any) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        server.route({
            method: 'get',
            path: '/public/studies/{studyName}/participants',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController.prototype.getParticipants)),
                ],
                handler: function ParticipantController_getParticipants(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
                    };

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = getValidatedArgs(args, request, h);
                    } catch (err) {
                        const error = err as any;
                        if (isBoom(error)) {
                            throw error;
                        }

                        const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                        boomErr.output.statusCode = error.status || 500;
                        boomErr.output.payload = {
                            name: error.name,
                            fields: error.fields,
                            message: error.message,
                        } as unknown as Payload;
                        throw boomErr;
                    }

                    const controller = new ParticipantController();

                    const promise = controller.getParticipants.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, undefined, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        server.route({
            method: 'get',
            path: '/public/studies/{studyName}/participants/{pseudonym}',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController.prototype.getParticipant)),
                ],
                handler: function ParticipantController_getParticipant(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                    };

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = getValidatedArgs(args, request, h);
                    } catch (err) {
                        const error = err as any;
                        if (isBoom(error)) {
                            throw error;
                        }

                        const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                        boomErr.output.statusCode = error.status || 500;
                        boomErr.output.payload = {
                            name: error.name,
                            fields: error.fields,
                            message: error.message,
                        } as unknown as Payload;
                        throw boomErr;
                    }

                    const controller = new ParticipantController();

                    const promise = controller.getParticipant.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, undefined, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        server.route({
            method: 'post',
            path: '/public/studies/{studyName}/participants',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController.prototype.postParticipant)),
                ],
                handler: function ParticipantController_postParticipant(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
                            participant: {"in":"body","name":"participant","required":true,"ref":"CreateParticipantRequestDto"},
                    };

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = getValidatedArgs(args, request, h);
                    } catch (err) {
                        const error = err as any;
                        if (isBoom(error)) {
                            throw error;
                        }

                        const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                        boomErr.output.statusCode = error.status || 500;
                        boomErr.output.payload = {
                            name: error.name,
                            fields: error.fields,
                            message: error.message,
                        } as unknown as Payload;
                        throw boomErr;
                    }

                    const controller = new ParticipantController();

                    const promise = controller.postParticipant.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, 201, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        server.route({
            method: 'patch',
            path: '/public/studies/{studyName}/participants/{pseudonym}',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController.prototype.patchParticipant)),
                ],
                handler: function ParticipantController_patchParticipant(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            participantPatch: {"in":"body","name":"participantPatch","required":true,"ref":"PatchParticipantRequestDto"},
                    };

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = getValidatedArgs(args, request, h);
                    } catch (err) {
                        const error = err as any;
                        if (isBoom(error)) {
                            throw error;
                        }

                        const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                        boomErr.output.statusCode = error.status || 500;
                        boomErr.output.payload = {
                            name: error.name,
                            fields: error.fields,
                            message: error.message,
                        } as unknown as Payload;
                        throw boomErr;
                    }

                    const controller = new ParticipantController();

                    const promise = controller.patchParticipant.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, undefined, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        server.route({
            method: 'delete',
            path: '/public/studies/{studyName}/participants/{pseudonym}',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(ParticipantController.prototype.deleteParticipant)),
                ],
                handler: function ParticipantController_deleteParticipant(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            deletionType: {"default":"default","in":"query","name":"deletionType","ref":"ParticipantDeletionType"},
                    };

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = getValidatedArgs(args, request, h);
                    } catch (err) {
                        const error = err as any;
                        if (isBoom(error)) {
                            throw error;
                        }

                        const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                        boomErr.output.statusCode = error.status || 500;
                        boomErr.output.payload = {
                            name: error.name,
                            fields: error.fields,
                            message: error.message,
                        } as unknown as Payload;
                        throw boomErr;
                    }

                    const controller = new ParticipantController();

                    const promise = controller.deleteParticipant.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, 204, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, h: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            hapiAuthentication(request, name, secMethod[name])
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            hapiAuthentication(request, name, secMethod[name])
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await promiseAny.call(Promise, secMethodOrPromises);
                return request['user'];
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                if (isBoom(error)) {
                    throw error;
                }

                const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                boomErr.output.statusCode = error.status || 401;
                boomErr.output.payload = {
                    name: error.name,
                    message: error.message,
                } as unknown as Payload;

                throw boomErr;
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }


    function promiseHandler(controllerObj: any, promise: any, request: any, successStatus: any, h: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode = successStatus;
                let headers;

                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                if (isController(controllerObj)) {
                    headers = controllerObj.getHeaders();
                    statusCode = controllerObj.getStatus() || statusCode;
                }
                return returnHandler(h, statusCode, data, headers);;
            })
            .catch((error: any) => {
                if (isBoom(error)) {
                    throw error;
                }

                const boomErr = boomify(error instanceof Error ? error : new Error(error.message));
                boomErr.output.statusCode = error.status || 500;
                boomErr.output.payload = {
                    name: error.name,
                    message: error.message,
                } as unknown as Payload;
                throw boomErr;
            });
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function returnHandler(h: any, statusCode?: number, data?: any, headers: any = {}) {
        if (h.__isTsoaResponded) {
            return h.__isTsoaResponded;
        }

        let response = data !== null && data !== undefined
                    ? h.response(data).code(200)
                    : h.response("").code(204);

        Object.keys(headers).forEach((name: string) => {
            response.header(name, headers[name]);
        });

        if (statusCode) {
            response.code(statusCode);
        }

        h.__isTsoaResponded = response;

        return response;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function getValidatedArgs(args: any, request: any, h: any): any[] {
        const errorFields: FieldErrors = {};
        const values = Object.keys(args).map(key => {
            const name = args[key].name;
            switch (args[key].in) {
            case 'request':
                return request;
            case 'query':
                return validationService.ValidateParam(args[key], request.query[name], name, errorFields, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"})
            case 'queries':
                return validationService.ValidateParam(args[key], request.query, name, errorFields, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"})
            case 'path':
                return validationService.ValidateParam(args[key], request.params[name], name, errorFields, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"})
            case 'header':
                return validationService.ValidateParam(args[key], request.headers[name], name, errorFields, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
            case 'body':
                return validationService.ValidateParam(args[key], request.payload, name, errorFields, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
            case 'body-prop':
                return validationService.ValidateParam(args[key], request.payload[name], name, errorFields, 'body.', {"noImplicitAdditionalProperties":"throw-on-extras"});
            case 'formData':
                return validationService.ValidateParam(args[key], request.payload[name], name, errorFields, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
            case 'res':
                return responder(h);
            }
        });
        if (Object.keys(errorFields).length > 0) {
            throw new ValidateError(errorFields, '');
        }
        return values;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function responder(h: any): TsoaResponse<HttpStatusCodeLiteral, unknown>  {
        return function(status, data, headers) {
           returnHandler(h, status, data, headers);
        };
    };

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
