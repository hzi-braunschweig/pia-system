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
 - add additional text element 'newTermsNote' 
 - assign client attribute tosUri and policyUri
 - add form group with checkboxes for tosUri and policyUri
 - add js to disable accept button if checkboxes are not checked 
 - add dialog logic to handle opening and closing the dialog
-->



<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#assign tosUri = client.attributes['tosUri']!>
    <#assign policyUri = client.attributes['policyUri']!>
    <#if section = "header">
        ${msg("termsTitle")}
    <#elseif section = "form">
        <div id="kc-terms-text">
            ${kcSanitize(msg("newTermsNote"))?no_esc}
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" id="piaTosConfirm" name="piaTosConfirm" value="yes"
                                data-e2e="checkbox-tos-confirm">
                        ${kcSanitize(msg('piaTosConfirmLabel', tosUri))?no_esc}
                    </label>                       
                </div>      

                <div class="checkbox">
                    <label>
                        <input type="checkbox" id="piaPolicyConfirm" name="piaPolicyConfirm" value="yes"
                                data-e2e="checkbox-policy-confirm">
                        ${kcSanitize(msg('piaPolicyConfirmLabel', tosUri))?no_esc}
                    </label>                       
                </div>                  
            </div>
        </div>
        <form class="form-actions flex-end" action="${url.loginAction}" method="POST">
            <input class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonLargeClass!}" name="decline" id="kc-decline" type="submit" value="${msg("doDecline")}"/>
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}" name="accept" id="kc-accept" type="submit" value="${msg("doAccept")}"/>
        </form>
    <div class="clearfix"></div>
    <dialog id="decline-terms-dialog">
        <div class="dialog-content">
            <p>${kcSanitize(msg("declineTermsNote"))?no_esc}</p>
        </div>
        <div class="flex-end">
            <button id="dialog-cancel" class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonLargeClass!}">
                ${msg("doCancel")}
            </button>            
            <button id="dialog-confirm" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}">
                ${msg("doDecline")}
            </button>            
        </div>
    </dialog>
    <script type="text/javascript">
        function checkCheckboxes() {
            var acceptTos = document.getElementById('piaTosConfirm').checked;
            var acceptPolicy = document.getElementById('piaPolicyConfirm').checked;
            var acceptButton = document.getElementById('kc-accept');
            acceptButton.disabled = !(acceptTos && acceptPolicy);
        }
        document.getElementById('piaTosConfirm').addEventListener('change', checkCheckboxes);
        document.getElementById('piaPolicyConfirm').addEventListener('change', checkCheckboxes);
        checkCheckboxes();

        document.getElementById('kc-decline').addEventListener('click', function(event) {
            event.preventDefault();
            const dialog = document.querySelector("dialog");
            dialog.showModal();
        });

        document.getElementById('dialog-confirm').addEventListener('click', function() {
            const dialog = document.querySelector("dialog");

            window.location.href = "/";
        });

        document.getElementById('dialog-cancel').addEventListener('click', function() {
            const dialog = document.querySelector("dialog");
            dialog.close();
        });
    </script>
    </#if>
</@layout.registrationLayout>