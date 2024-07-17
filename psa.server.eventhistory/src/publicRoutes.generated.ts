// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TsoaRoute, fetchMiddlewares, HapiTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EventHistoryController } from './controllers/public/eventHistoryController';
import { hapiAuthentication } from './auth';
// @ts-ignore - no great way to install types from subpackage
import { boomify, isBoom, type Payload } from '@hapi/boom';
import type { Request, ResponseToolkit, RouteOptionsPreAllOptions } from '@hapi/hapi';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Pick_SupportedMessages.Exclude_keyofSupportedMessages.studyName__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pseudonym":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_SupportedMessages.studyName_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_SupportedMessages.Exclude_keyofSupportedMessages.studyName__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Event.Exclude_keyofEvent.type__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"double","required":true},"studyName":{"dataType":"string","required":true},"payload":{"ref":"Omit_SupportedMessages.studyName_","required":true},"timestamp":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_Event.type_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Event.Exclude_keyofEvent.type__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventTypeString": {
        "dataType": "refAlias",
        "type": {"dataType":"enum","enums":["compliance.created","proband.created","proband.deleted","proband.deactivated","proband.logged_in","proband.email_verified","questionnaire_instance.created","questionnaire_instance.activated","questionnaire_instance.answering_started","questionnaire_instance.released","questionnaire_instance.expired"],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Omit_Event.type_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"ref":"EventTypeString","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StatusCodes.NOT_FOUND": {
        "dataType": "refEnum",
        "enums": [404],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventHistoryIsDisabledError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
            "statusCode": {"ref":"StatusCodes.NOT_FOUND","default":404},
            "errorCode": {"dataType":"enum","enums":["EVENT_HISTORY_IS_DISABLED"],"default":"EVENT_HISTORY_IS_DISABLED"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StatusCodes.FORBIDDEN": {
        "dataType": "refEnum",
        "enums": [403],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ClientHasNoAccessToStudyError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
            "statusCode": {"ref":"StatusCodes.FORBIDDEN","default":403},
            "errorCode": {"dataType":"enum","enums":["CLIENT_HAS_NO_ACCESS_TO_STUDY"],"default":"CLIENT_HAS_NO_ACCESS_TO_STUDY"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Error": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudyName": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new HapiTemplateService(
  models,
  {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true},
  { boomify, isBoom },
);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(server: any) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        server.route({
            method: 'get',
            path: '/public/event-history',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(EventHistoryController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(EventHistoryController.prototype.getEvents)),
                ],
                handler: function EventHistoryController_getEvents(request: Request, h: ResponseToolkit) {
                    const args: Record<string, TsoaRoute.ParameterSchema> = {
                            request: {"in":"request","name":"request","required":true,"dataType":"object"},
                            studyName: {"in":"query","name":"studyName","ref":"StudyName"},
                            from: {"in":"query","name":"from","dataType":"datetime"},
                            to: {"in":"query","name":"to","dataType":"datetime"},
                            type: {"in":"query","name":"type","ref":"EventTypeString"},
                    };

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = templateService.getValidatedArgs({ args, request, h });
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

                    const controller = new EventHistoryController();

                    return templateService.apiHandler({
                      methodName: 'getEvents',
                      controller,
                      h,
                      validatedArgs,
                      successStatus: 200,
                    });
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
                request['user'] = await Promise.any(secMethodOrPromises);
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
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
