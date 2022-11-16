<#--
SPDX-FileCopyrightText: 2004 Red Hat, Inc. and/or its affiliates and other contributors

SPDX-License-Identifier: Apache-2.0

Copyright 2004 Red Hat, Inc. and/or its affiliates
and other contributors as indicated by the @author tags.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

This file has been modified:
 - removed all fields except for email, password, password-confirm
 - added hidden field for study name
 - automatically set username to email address without showing and setting registrationEmailAsUsername
-->

<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','piaTosConfirm','piaPolicyConfirm'); section>
    <#if section = "header">
        ${msg("registerTitle")}
    <#elseif section = "form">
        <h2 class="pia-login-subtitle" data-e2e="registration-subtitle">${kcSanitize(msg('piaRegistrationSubtitle', studyName))?no_esc}</h2>

        <div class="pia-alert">
            <div class="pia-alert-content">
                ${kcSanitize(msg("piaRegistrationUsernameHint"))?no_esc}
            </div>
        </div>

        <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post" onsubmit="document.getElementById('username').value = document.getElementById('email').value">
            <div class="${properties.kcFormGroupClass!}">
                <div class="${properties.kcLabelWrapperClass!}">
                    <label for="email" class="${properties.kcLabelClass!}">${msg("email")}</label>
                </div>
                <div class="${properties.kcInputWrapperClass!}">
                    <input type="text" id="email" class="${properties.kcInputClass!}" name="email"
                           value="${(register.formData.email!'')}" autocomplete="email"
                           aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"
                           data-e2e="registration-input-email"
                    />

                    <#if messagesPerField.existsError('email')>
                        <span id="input-error-email" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('email'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>

            <#if !realm.registrationEmailAsUsername>
                <div class="${properties.kcFormGroupClass!}" style="display: none">
                    <div class="${properties.kcLabelWrapperClass!}">
                        <label for="username" class="${properties.kcLabelClass!}">${msg("username")}</label>
                    </div>
                    <div class="${properties.kcInputWrapperClass!}">
                        <input type="text" id="username" class="${properties.kcInputClass!}" name="username"
                               value="${(register.formData.username!'')}" autocomplete="username"
                               aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                        />

                        <#if messagesPerField.existsError('username')>
                            <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('username'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>
            </#if>

            <#if passwordRequired??>
                <div class="${properties.kcFormGroupClass!}">
                    <div class="${properties.kcLabelWrapperClass!}">
                        <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
                    </div>
                    <div class="${properties.kcInputWrapperClass!}">
                        <input type="password" id="password" class="${properties.kcInputClass!}" name="password"
                               autocomplete="new-password"
                               aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                               data-e2e="registration-input-password"
                        />

                        <button type="button" id="reveal-password-button" class="input-icon-button-suffix" tabindex="-1">
                            <img class="icon-eye" src="${url.resourcesPath}/img/eye.svg" alt="show password button icon"/>
                        </button>

                        <#if messagesPerField.existsError('password')>
                            <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('password'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>

                <div class="${properties.kcFormGroupClass!}">
                    <div class="${properties.kcLabelWrapperClass!}">
                        <label for="password-confirm"
                               class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>
                    </div>
                    <div class="${properties.kcInputWrapperClass!}">
                        <input type="password" id="password-confirm" class="${properties.kcInputClass!}"
                               name="password-confirm"
                               aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                               data-e2e="registration-input-password-confirm"
                        />

                        <button type="button" id="reveal-password-confirm-button" class="input-icon-button-suffix" tabindex="-1">
                            <img class="icon-eye" src="${url.resourcesPath}/img/eye.svg" alt="show password button icon"/>
                        </button>

                        <#if messagesPerField.existsError('password-confirm')>
                            <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>

                <div class="pia-alert">
                    <div class="pia-alert-content">
                        <span class="pia-alert-summary">${kcSanitize(msg("piaPasswordRulesHint"))?no_esc}</span>
                    </div>
                </div>
            </#if>

            <#if tosUri?has_content>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="piaTosConfirm" <#if register.formData['piaTosConfirm']?has_content>checked</#if>
                                   aria-invalid="<#if messagesPerField.existsError('piaTosConfirm')>true</#if>"
                                   data-e2e="registration-checkbox-tos-confirm">
                            ${msg('piaRegistrationTosConfirmLabel', tosUri)?no_esc}
                        </label>
                        <#if messagesPerField.existsError('tos-confirm')>
                            <span class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('tos-confirm'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>
            </#if>

            <#if policyUri?has_content>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="piaPolicyConfirm" <#if register.formData['piaPolicyConfirm']?has_content>checked</#if>
                                   aria-invalid="<#if messagesPerField.existsError('piaPolicyConfirm')>true</#if>"
                                   data-e2e="registration-checkbox-policy-confirm">
                            ${msg('piaRegistrationPolicyConfirmLabel', policyUri)?no_esc}
                        </label>
                        <#if messagesPerField.existsError('policy-confirm')>
                            <span class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('policy-confirm'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>
            </#if>

            <#if recaptchaRequired??>
                <div class="form-group">
                    <div class="${properties.kcInputWrapperClass!}">
                        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                    </div>
                </div>
            </#if>

            <div class="${properties.kcFormGroupClass!}">
                <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
                    <div class="${properties.kcFormOptionsWrapperClass!}">
                        <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                    </div>
                </div>

                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                           type="submit"
                           value="${msg("doRegister")}"
                           data-e2e="registration-submit-button"
                    />
                </div>
            </div>

            <input type="hidden" id="user.attributes.study" name="user.attributes.study"
                   value="${(register.formData['user.attributes.study']!'')}"
            />
        </form>
    </#if>
</@layout.registrationLayout>