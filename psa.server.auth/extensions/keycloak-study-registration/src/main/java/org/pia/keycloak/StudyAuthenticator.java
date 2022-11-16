/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

package org.pia.keycloak;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;

import javax.ws.rs.core.Response;

public class StudyAuthenticator implements Authenticator {

    private final StudyHelper studyHelper;

    public StudyAuthenticator(StudyHelper studyHelper) {
        this.studyHelper = studyHelper;
    }

    private String getStudyKey(AuthenticationFlowContext context) {
        return context.getHttpRequest().getUri().getQueryParameters().getFirst(StudyFormAction.PARAM_STUDY);
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        RealmModel realm = context.getRealm();
        String study = getStudyKey(context);

        if (study == null || study.equals("")) {
            Response response = context.form()
                    .setError(StudyRegistrationMessages.STUDY_MISSING)
                    .createErrorPage(Response.Status.BAD_REQUEST);

            context.failure(AuthenticationFlowError.ACCESS_DENIED, response);
            return;
        }

        studyHelper.init(realm, study);

        if (!studyHelper.studyGroupIsOpen()) {
            Response response = context.form()
                    .setError(StudyRegistrationMessages.STUDY_NOT_OPEN)
                    .createErrorPage(Response.Status.FORBIDDEN);

            context.failure(AuthenticationFlowError.ACCESS_DENIED, response);
            return;
        }

        if (studyHelper.reachedRegistrationLimit()) {
            Response response = context.form()
                    .setError(StudyRegistrationMessages.LIMIT_REACHED)
                    .createErrorPage(Response.Status.FORBIDDEN);

            context.failure(AuthenticationFlowError.ACCESS_DENIED, response);
            return;
        }

        // attach current study to user session
        context.getAuthenticationSession().setUserSessionNote(StudyFormAction.PARAM_STUDY, study);

        context.success();
    }

    @Override
    public void action(AuthenticationFlowContext context) {

    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession keycloakSession, RealmModel realmModel, UserModel userModel) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession keycloakSession, RealmModel realmModel, UserModel userModel) {

    }

    @Override
    public void close() {

    }
}
