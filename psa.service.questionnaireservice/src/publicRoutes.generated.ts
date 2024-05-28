// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { QuestionnaireInstanceController } from './controllers/public/questionnaireInstanceController';
import { hapiAuthentication } from './auth';
// @ts-ignore - no great way to install types from subpackage
import { boomify, isBoom, type Payload } from '@hapi/boom';
import type { Request, RouteOptionsPreAllOptions } from '@hapi/hapi';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "QuestionnaireInstanceStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["inactive"]},{"dataType":"enum","enums":["active"]},{"dataType":"enum","enums":["in_progress"]},{"dataType":"enum","enums":["released"]},{"dataType":"enum","enums":["released_once"]},{"dataType":"enum","enums":["released_twice"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["deleted"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_QuestionnaireInstance.Exclude_keyofQuestionnaireInstance.questionnaire-or-answers-or-studyId__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"integer","required":true},"questionnaireName":{"dataType":"string","required":true},"pseudonym":{"dataType":"string","required":true},"dateOfIssue":{"dataType":"datetime","required":true},"dateOfReleaseV1":{"dataType":"datetime","required":true},"dateOfReleaseV2":{"dataType":"datetime","required":true},"cycle":{"dataType":"integer","required":true},"status":{"ref":"QuestionnaireInstanceStatus","required":true},"notificationsScheduled":{"dataType":"boolean","required":true},"progress":{"dataType":"integer","required":true},"releaseVersion":{"dataType":"integer","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_QuestionnaireInstance.questionnaire-or-answers-or-studyId_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_QuestionnaireInstance.Exclude_keyofQuestionnaireInstance.questionnaire-or-answers-or-studyId__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudyName": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CustomName": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^[a-zA-Z0-9-_]+$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetQuestionnaireInstanceResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Omit_QuestionnaireInstance.questionnaire-or-answers-or-studyId_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"questionnaireCustomName":{"dataType":"union","subSchemas":[{"ref":"CustomName"},{"dataType":"enum","enums":[null]}],"required":true},"questionnaireVersion":{"dataType":"integer","required":true},"questionnaireId":{"dataType":"integer","required":true},"studyName":{"ref":"StudyName","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudyNotFoundError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QuestionnaireInstanceNotFoundError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
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
    "Pseudonym": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^[a-z]+-[0-9]+$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_QuestionnaireInstanceDto.status-or-releaseVersion-or-progress_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"ref":"QuestionnaireInstanceStatus","required":true},"progress":{"dataType":"integer","required":true},"releaseVersion":{"dataType":"integer","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PatchQuestionnaireInstanceResponseDto": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_QuestionnaireInstanceDto.status-or-releaseVersion-or-progress_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InvalidQuestionnaireCycleUnitError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InvalidStatusTransitionError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReleaseNeedsAnswersError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResourceID": {
        "dataType": "refAlias",
        "type": {"dataType":"integer","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QuestionnaireInstanceIdentifier": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResourceID"},{"ref":"CustomName"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_QuestionnaireInstanceDto.status_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"ref":"QuestionnaireInstanceStatus","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PatchQuestionnaireInstanceRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_QuestionnaireInstanceDto.status_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TextValue": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pzn": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^-[0-9]{8}$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IsoDateString": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^\\d{4}-\\d{2}-\\d{2}$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IsoTimestampString": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SingleSelectValue": {
        "dataType": "refAlias",
        "type": {"dataType":"integer","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MultipleSelectValue": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"integer"},"validators":{}},
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
            "sampleId": {"ref":"SampleId","required":true},
            "dummySampleId": {"ref":"SampleId"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "base64file": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"^data:(\\w+\\/[-+.\\w]+);base64,(.+)$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserFileDto": {
        "dataType": "refObject",
        "properties": {
            "file": {"ref":"base64file","required":true},
            "fileName": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnswerValue": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":[null]},{"ref":"TextValue"},{"ref":"Pzn"},{"ref":"IsoDateString"},{"ref":"IsoTimestampString"},{"ref":"SingleSelectValue"},{"ref":"MultipleSelectValue"},{"ref":"SampleDto"},{"ref":"UserFileDto"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Required_PostAnswerRequestDto_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"questionVariableName":{"dataType":"string","required":true},"answerOptionVariableName":{"dataType":"string","required":true},"value":{"ref":"AnswerValue","required":true},"dateOfRelease":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnswerTypeKeys": {
        "dataType": "refAlias",
        "type": {"dataType":"enum","enums":["None","SingleSelect","MultiSelect","Number","Text","Date","Sample","PZN","Image","Timestamp","File"],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostAnswerResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Required_PostAnswerRequestDto_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"ref":"AnswerTypeKeys","required":true},"version":{"dataType":"integer","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CouldNotCreateOrUpdateAnswersError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostAnswerRequestDto": {
        "dataType": "refObject",
        "properties": {
            "questionVariableName": {"dataType":"string","required":true},
            "answerOptionVariableName": {"dataType":"string","required":true},
            "value": {"ref":"AnswerValue","required":true},
            "dateOfRelease": {"ref":"IsoTimestampString"},
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
            method: 'get',
            path: '/public/studies/{studyName}/participants/{pseudonym}/questionnaire-instances',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(QuestionnaireInstanceController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(QuestionnaireInstanceController.prototype.getQuestionnaireInstances)),
                ],
                handler: function QuestionnaireInstanceController_getQuestionnaireInstances(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"ref":"StudyName"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            questionnaireCustomName: {"in":"query","name":"questionnaireCustomName","ref":"CustomName"},
                            status: {"in":"query","name":"status","ref":"QuestionnaireInstanceStatus"},
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

                    const controller = new QuestionnaireInstanceController();

                    const promise = controller.getQuestionnaireInstances.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, 200, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        server.route({
            method: 'patch',
            path: '/public/studies/{studyName}/participants/{pseudonym}/questionnaire-instances/{identifier}',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(QuestionnaireInstanceController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(QuestionnaireInstanceController.prototype.patchQuestionnaireInstance)),
                ],
                handler: function QuestionnaireInstanceController_patchQuestionnaireInstance(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"ref":"StudyName"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            identifier: {"in":"path","name":"identifier","required":true,"ref":"QuestionnaireInstanceIdentifier"},
                            questionnaire: {"in":"body","name":"questionnaire","required":true,"ref":"PatchQuestionnaireInstanceRequestDto"},
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

                    const controller = new QuestionnaireInstanceController();

                    const promise = controller.patchQuestionnaireInstance.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, 200, h);
                }
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        server.route({
            method: 'post',
            path: '/public/studies/{studyName}/participants/{pseudonym}/questionnaire-instances/{identifier}/answers',
            options: {
                pre: [
                    {
                      method: authenticateMiddleware([{"jwt-public":[]}])
                    },
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(QuestionnaireInstanceController)),
                    ...(fetchMiddlewares<RouteOptionsPreAllOptions>(QuestionnaireInstanceController.prototype.postQuestionnaireInstanceAnswers)),
                ],
                handler: function QuestionnaireInstanceController_postQuestionnaireInstanceAnswers(request: any, h: any) {
                    const args = {
                            studyName: {"in":"path","name":"studyName","required":true,"ref":"StudyName"},
                            pseudonym: {"in":"path","name":"pseudonym","required":true,"ref":"Pseudonym"},
                            identifier: {"in":"path","name":"identifier","required":true,"ref":"QuestionnaireInstanceIdentifier"},
                            answers: {"in":"body","name":"answers","required":true,"dataType":"array","array":{"dataType":"refObject","ref":"PostAnswerRequestDto"}},
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

                    const controller = new QuestionnaireInstanceController();

                    const promise = controller.postQuestionnaireInstanceAnswers.apply(controller, validatedArgs as any);
                    return promiseHandler(controller, promise, request, 200, h);
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
