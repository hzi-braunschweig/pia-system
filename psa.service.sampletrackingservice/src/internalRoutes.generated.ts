// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SampleController } from './controllers/internal/sampleController';
import { boomify, isBoom, type Payload } from '@hapi/boom';
import type { Request, RouteOptionsPreAllOptions } from '@hapi/hapi';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "LabResultStatus": {
        "dataType": "refEnum",
        "enums": ["new","analyzed","inactive"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudyStatus": {
        "dataType": "refEnum",
        "enums": ["active","deactivated","deletion_pending","deleted"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LabResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "dummyId": {"dataType":"string","required":true},
            "pseudonym": {"dataType":"string","required":true},
            "dateOfSampling": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "remark": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"ref":"LabResultStatus","required":true},
            "newSamplesSent": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}],"required":true},
            "performingDoctor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "studyStatus": {"ref":"StudyStatus","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pseudonym": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^[a-z]+-[0-9]+$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SampleId": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^([A-Z]+-)?[0-9]+$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SampleDto": {
        "dataType": "refObject",
        "properties": {
            "dateOfSampling": {"dataType":"datetime","required":true},
            "dummyId": {"ref":"SampleId"},
        },
        "additionalProperties": false,
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
            method: 'patch',
            path: '/study/{studyName}/participants/{pseudonym}/samples/{sampleId}',
            options: {
                pre: [
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(SampleController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(SampleController.prototype.patchSample)),
                ],
                handler: function SampleController_patchSample(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            sampleId: {"in":"path","name":"sampleId","required":true,"ref":"SampleId"},
                            sample: {"in":"body","name":"sample","required":true,"ref":"SampleDto"},
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

                    const controller = new SampleController();

                    const promise = controller.patchSample.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, undefined, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


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
