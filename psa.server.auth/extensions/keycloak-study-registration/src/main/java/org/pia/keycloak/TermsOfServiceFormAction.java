/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

package org.pia.keycloak;

import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;

import jakarta.ws.rs.core.MultivaluedMap;
import java.util.ArrayList;
import java.util.List;

public class TermsOfServiceFormAction implements FormAction {
    public static final String TOS_URI = "tosUri";
    public static final String POLICY_URI = "policyUri";
    public static final String FIELDNAME_TOS_CONFIRM = "piaTosConfirm";
    public static final String FIELDNAME_POLICY_CONFIRM = "piaPolicyConfirm";
    private String tosUri;
    private String policyUri;

    TermsOfServiceFormAction(KeycloakSession session) {
        ClientModel currentClient = session.getContext().getClient();
        tosUri = currentClient.getAttribute(ClientModel.TOS_URI);
        policyUri = currentClient.getAttribute(ClientModel.POLICY_URI);
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {
        form.setAttribute(TOS_URI, tosUri);
        form.setAttribute(POLICY_URI, policyUri);
    }

    @Override
    public void validate(ValidationContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        List<FormMessage> errors = new ArrayList<>();

        String tosConfirmValue = formData.getFirst(FIELDNAME_TOS_CONFIRM);
        if(isTosUriSet() && (tosConfirmValue == null || tosConfirmValue.isEmpty())) {
            context.error(StudyRegistrationMessages.CONFIRM_TOS);
            errors.add(new FormMessage(FIELDNAME_TOS_CONFIRM, StudyRegistrationMessages.CONFIRM_TOS));
        }

        String policyConfirmValue = formData.getFirst(FIELDNAME_POLICY_CONFIRM);
        if(isPolicyUriSet() && (policyConfirmValue == null || policyConfirmValue.isEmpty())) {
            context.error(StudyRegistrationMessages.CONFIRM_POLICY);
            errors.add(new FormMessage(FIELDNAME_POLICY_CONFIRM, StudyRegistrationMessages.CONFIRM_POLICY));
        }

        if(errors.size() > 0) {
            context.validationError(formData, errors);
            return;
        }

        context.success();
    }

    @Override
    public void success(FormContext context) {

    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return false;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {

    }

    @Override
    public void close() {

    }

    private boolean isTosUriSet() {
        return tosUri != null && !tosUri.isEmpty();
    }

    private boolean isPolicyUriSet() {
        return policyUri != null && !policyUri.isEmpty();
    }
}
