// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import { fetchMiddlewares, HapiTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SampleController } from './controllers/internal/sampleController';
import { boomify, isBoom, type Payload } from '@hapi/boom';
import type { Request, ResponseToolkit, RouteOptionsPreAllOptions } from '@hapi/hapi';

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
        "type": {"dataType":"string","validators":{"pattern":{"value":"^[a-z0-9]+-[0-9]+$"}}},
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
        const argsSampleController_patchSample: Record<string, TsoaRoute.ParameterSchema> = {
            studyName: {"in":"path","name":"studyName","required":true,"dataType":"string"},
            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
            sampleId: {"in":"path","name":"sampleId","required":true,"ref":"SampleId"},
            sample: {"in":"body","name":"sample","required":true,"ref":"SampleDto"},
        };
        server.route({
            method: 'patch',
            path: '/study/{studyName}/participants/{pseudonym}/samples/{sampleId}',
            options: {
                pre: [
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(SampleController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(SampleController.prototype.patchSample)),
                ],
                handler: function SampleController_patchSample(request: Request, h: ResponseToolkit) {

                    let validatedArgs: any[] = [];
                    try {
                        validatedArgs = templateService.getValidatedArgs({ args: argsSampleController_patchSample, request, h });
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

                    return templateService.apiHandler({
                      methodName: 'patchSample',
                      controller,
                      h,
                      validatedArgs,
                      successStatus: undefined,
                    });
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa



    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
