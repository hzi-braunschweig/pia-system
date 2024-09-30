// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TsoaRoute, fetchMiddlewares, HapiTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PersonalDataController } from './controllers/personalDataController';
import { hapiAuthentication } from './auth';
// @ts-ignore - no great way to install types from subpackage
import { boomify, isBoom, type Payload } from '@hapi/boom';
import type { Request, ResponseToolkit, RouteOptionsPreAllOptions } from '@hapi/hapi';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "PartialAddress": {
        "dataType": "refObject",
        "properties": {
            "street": {"dataType":"string"},
            "houseNumber": {"dataType":"string"},
            "city": {"dataType":"string"},
            "postalCode": {"dataType":"string"},
            "state": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PhoneNumbers": {
        "dataType": "refObject",
        "properties": {
            "private": {"dataType":"string"},
            "work": {"dataType":"string"},
            "mobile": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PersonalDataPatchResponseDto": {
        "dataType": "refObject",
        "properties": {
            "address": {"ref":"PartialAddress"},
            "salutation": {"dataType":"string"},
            "title": {"dataType":"string"},
            "firstname": {"dataType":"string"},
            "lastname": {"dataType":"string"},
            "phone": {"ref":"PhoneNumbers"},
            "email": {"dataType":"string","validators":{"pattern":{"value":"^.+\\@.+\\..+$"}}},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SpecificError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
            "statusCode": {"dataType":"double","required":true},
            "errorCode": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StatusCodes.UNAUTHORIZED": {
        "dataType": "refEnum",
        "enums": [401],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InvalidAuthorizationTokenError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"enum","enums":["No or invalid authorization token provided"],"default":"No or invalid authorization token provided"},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
            "statusCode": {"ref":"StatusCodes.UNAUTHORIZED","default":401},
            "errorCode": {"dataType":"enum","enums":["INVALID_AUTHORIZATION_TOKEN"],"default":"INVALID_AUTHORIZATION_TOKEN"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StatusCodes.FORBIDDEN": {
        "dataType": "refEnum",
        "enums": [403],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MissingStudyAccessError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "causedBy": {"dataType":"any"},
            "statusCode": {"ref":"StatusCodes.FORBIDDEN","default":403},
            "errorCode": {"dataType":"enum","enums":["MISSING_STUDY_ACCESS"],"default":"MISSING_STUDY_ACCESS"},
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
    "Pseudonym": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^[a-z0-9]+-[0-9]+$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PersonalDataPatchRequestDto": {
        "dataType": "refObject",
        "properties": {
            "salutation": {"dataType":"string"},
            "title": {"dataType":"string"},
            "firstname": {"dataType":"string"},
            "lastname": {"dataType":"string"},
            "phone": {"ref":"PhoneNumbers"},
            "email": {"dataType":"string","validators":{"pattern":{"value":"^.+\\@.+\\..+$"}}},
            "comment": {"dataType":"string"},
            "address": {"ref":"PartialAddress"},
        },
        "additionalProperties": false,
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
            method: 'patch',
            path: '/public/studies/{studyName}/participants/{pseudonym}/personal-data',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(PersonalDataController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(PersonalDataController.prototype.patchPersonalData)),
                ],
                handler: function PersonalDataController_patchPersonalData(request: Request, h: ResponseToolkit) {
                    const args: Record<string, TsoaRoute.ParameterSchema> = {
                            studyName: {"in":"path","name":"studyName","required":true,"ref":"StudyName"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            personalData: {"in":"body","name":"personalData","required":true,"ref":"PersonalDataPatchRequestDto"},
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

                    const controller = new PersonalDataController();

                    return templateService.apiHandler({
                      methodName: 'patchPersonalData',
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
