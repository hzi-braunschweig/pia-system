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
import org.keycloak.models.*;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.sessions.AuthenticationSessionModel;

import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;
import java.util.ArrayList;
import java.util.List;

public class StudyFormAction implements FormAction {
    public static final String PARAM_STUDY = "study";
    public static final String ATTR_STUDY_NAME = "studyName";
    public static final String FIELD_USER_ATTR_STUDY = "user.attributes.study";
    public static final String FIELD_EMAIL = "email";
    private final StudyHelper studyHelper;

    public StudyFormAction(StudyHelper studyHelper) {
        this.studyHelper = studyHelper;
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider loginFormsProvider) {
        String study = getStudyKey(context);

        if (study != null && !study.equals("")) {
            MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();
            GroupModel group = context.getSession().groups().getGroupById(context.getRealm(), study);
            loginFormsProvider.setAttribute(ATTR_STUDY_NAME, group.getName());
            formData.putSingle(FIELD_USER_ATTR_STUDY, study);

            populateFields(context, formData);
            loginFormsProvider.setFormData(formData);
        }
    }

    @Override
    public void validate(ValidationContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        RealmModel realm = context.getRealm();
        String study = context.getHttpRequest().getDecodedFormParameters().getFirst(FIELD_USER_ATTR_STUDY);

        if (study == null || study.equals("")) {
            context.error(StudyRegistrationMessages.STUDY_MISSING);
            return;
        }

        studyHelper.init(realm, study);

        List<FormMessage> errors = new ArrayList<>();

        if (!studyHelper.studyGroupIsOpen()) {
            context.error(StudyRegistrationMessages.STUDY_NOT_OPEN);
            errors.add(new FormMessage(StudyRegistrationMessages.STUDY_NOT_OPEN));
        }

        if (studyHelper.reachedRegistrationLimit()) {
            context.error(StudyRegistrationMessages.LIMIT_REACHED);
            errors.add(new FormMessage(StudyRegistrationMessages.LIMIT_REACHED));
        }

        if (errors.size() > 0) {
            context.validationError(formData, errors);
            return;
        }

        context.success();
    }

    @Override
    public void success(FormContext formContext) {
        String study = formContext.getHttpRequest().getDecodedFormParameters().getFirst(FIELD_USER_ATTR_STUDY);

        GroupModel group = formContext.getSession().groups().getGroupById(formContext.getRealm(), study);
        formContext.getUser().joinGroup(group);

        RoleModel role = formContext.getSession().roles().getRealmRole(formContext.getRealm(), "Proband");
        formContext.getUser().grantRole(role);

        AuthenticationSessionModel authenticationSession = formContext.getSession().getContext().getAuthenticationSession();
        authenticationSession.addRequiredAction(VerifyEmailWithUsernameAcknowledgement.PROVIDER_ID);
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

    private String getStudyKey(FormContext context) {
        return context.getAuthenticationSession().getUserSessionNotes().get(PARAM_STUDY);
    }

    private void populateFields(FormContext context, MultivaluedMap<String, String> formData) {
        if(context.getHttpRequest().getHttpMethod().equalsIgnoreCase("post")) {
            MultivaluedMap<String, String> currentFormData = context.getHttpRequest().getDecodedFormParameters();
            if (currentFormData.containsKey(FIELD_EMAIL)) {
                formData.putSingle(FIELD_EMAIL, currentFormData.getFirst(FIELD_EMAIL));
            }
        }
    }
}
