/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

package org.pia.keycloak;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.GroupModel;
import org.keycloak.models.RoleModel;

import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StudyFormActionTest {
    private StudyHelper studyHelper;
    private StudyFormAction studyFormAction;
    private FormContext formContext;
    private LoginFormsProvider loginFormsProvider;
    private ValidationContext validationContext;

    @BeforeEach
    void setUp() {
        formContext = mock(FormContext.class, RETURNS_DEEP_STUBS);
        validationContext = mock(ValidationContext.class, RETURNS_DEEP_STUBS);
        studyHelper = mock(StudyHelper.class, RETURNS_DEEP_STUBS);
        loginFormsProvider = mock(LoginFormsProvider.class);
        studyFormAction = new StudyFormAction(studyHelper);

        when(formContext.getHttpRequest().getHttpMethod()).thenReturn("get");
    }

    @Test
    @DisplayName("Should populate the form with our parameter when set")
    void buildPageWithStudyParam() {
        String expectedStudy = "123-456-789";
        String expectedStudyName = "Test Study";
        setStudyInAuthenticationSession(expectedStudy);

        GroupModel group = mock(GroupModel.class);
        when(group.getName()).thenReturn(expectedStudyName);
        when(formContext.getSession().groups().getGroupById(any(), eq(expectedStudy))).thenReturn(group);

        MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();
        formData.add(StudyFormAction.FIELD_USER_ATTR_STUDY, expectedStudy);

        studyFormAction.buildPage(formContext, loginFormsProvider);

        verify(loginFormsProvider).setAttribute(StudyFormAction.ATTR_STUDY_NAME, expectedStudyName);
        verify(loginFormsProvider).setFormData(formData);
    }

    @Test
    @DisplayName("Should use study from form when parameter is not set")
    void buildPageWithStudyFormValue() {
        String expectedStudy = "123-456-789";
        String expectedStudyName = "Test Study";
        setStudyInAuthenticationSession(expectedStudy);

        when(formContext.getHttpRequest().getHttpMethod()).thenReturn("post");

        GroupModel group = mock(GroupModel.class);
        when(group.getName()).thenReturn(expectedStudyName);
        when(formContext.getSession().groups().getGroupById(any(), eq(expectedStudy))).thenReturn(group);

        MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();
        formData.add(StudyFormAction.FIELD_USER_ATTR_STUDY, expectedStudy);

        studyFormAction.buildPage(formContext, loginFormsProvider);

        verify(loginFormsProvider).setFormData(formData);
        verify(loginFormsProvider).setAttribute(StudyFormAction.ATTR_STUDY_NAME, expectedStudyName);
    }

    @ParameterizedTest
    @DisplayName("Should not populate the form when study parameter is missing")
    @NullSource
    @EmptySource
    void buildPageWithoutStudyParam(String study) {
        setStudyInAuthenticationSession(study);

        studyFormAction.buildPage(formContext, loginFormsProvider);

        verify(loginFormsProvider, never()).setFormData(any());
    }

    @Test
    @DisplayName("Should keep email adress when found in last sent formData")
    void buildPageKeepEmail() {
        String expectedStudy = "123-456-789";
        String expectedStudyName = "Test Study";
        String expectedEmail = "test@localhost";
        setStudyInAuthenticationSession(expectedStudy);

        GroupModel group = mock(GroupModel.class);
        when(group.getName()).thenReturn(expectedStudyName);
        when(formContext.getSession().groups().getGroupById(any(), eq(expectedStudy))).thenReturn(group);
        when(formContext.getHttpRequest().getHttpMethod()).thenReturn("post");

        MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();
        formData.add(StudyFormAction.FIELD_USER_ATTR_STUDY, expectedStudy);
        formData.add(StudyFormAction.FIELD_EMAIL, expectedEmail);

        when(formContext.getHttpRequest().getDecodedFormParameters()).thenReturn(formData);

        studyFormAction.buildPage(formContext, loginFormsProvider);

        verify(loginFormsProvider).setFormData(formData);
    }

    @ParameterizedTest
    @DisplayName("Should fail when study param is missing")
    @NullSource
    @EmptySource
    void validateWithoutStudyParam(String study) {
        setStudyFormValueForValidation(study);
        studyFormAction.validate(validationContext);
        verify(validationContext).error(StudyRegistrationMessages.STUDY_MISSING);
    }

    @Test
    @DisplayName("Should fail when study is closed")
    void validateStudyGroupClosed() {
        setStudyFormValueForValidation("123-456-789");
        when(studyHelper.studyGroupIsOpen()).thenReturn(false);

        studyFormAction.validate(validationContext);

        verify(studyHelper).init(any(), any());
        verify(validationContext).error(StudyRegistrationMessages.STUDY_NOT_OPEN);
        verify(validationContext, never()).error(StudyRegistrationMessages.LIMIT_REACHED);
        verify(validationContext).validationError(any(), any());
    }

    @Test
    @DisplayName("Should fail when registration limit is reached")
    void validateRegistrationLimitReached() {
        setStudyFormValueForValidation("123-456-789");
        when(studyHelper.studyGroupIsOpen()).thenReturn(true);
        when(studyHelper.reachedRegistrationLimit()).thenReturn(true);

        studyFormAction.validate(validationContext);

        verify(studyHelper).init(any(), any());
        verify(validationContext, never()).error(StudyRegistrationMessages.STUDY_NOT_OPEN);
        verify(validationContext).error(StudyRegistrationMessages.LIMIT_REACHED);
        verify(validationContext).validationError(any(), any());
    }

    @Test
    @DisplayName("Validation should succeed")
    void validateSuccess() {
        setStudyFormValueForValidation("123-456-789");
        when(studyHelper.studyGroupIsOpen()).thenReturn(true);
        when(studyHelper.reachedRegistrationLimit()).thenReturn(false);

        studyFormAction.validate(validationContext);

        verify(studyHelper).init(any(), any());
        verify(validationContext).success();
    }


    @Test
    @DisplayName("Should add group and role")
    void success() {
        String study = "123-456-789";
        when(formContext.getHttpRequest().getDecodedFormParameters().getFirst(StudyFormAction.FIELD_USER_ATTR_STUDY)).thenReturn(study);

        GroupModel group = mock(GroupModel.class);
        when(formContext.getSession().groups().getGroupById(any(), eq(study))).thenReturn(group);

        RoleModel role = mock(RoleModel.class);
        when(formContext.getSession().roles().getRealmRole(any(), eq("Proband"))).thenReturn(role);

        studyFormAction.success(formContext);

        verify(formContext.getUser()).joinGroup(group);
        verify(formContext.getUser()).grantRole(role);
    }

    private void setStudyInAuthenticationSession(String value) {
        when(formContext.getAuthenticationSession().getUserSessionNotes().get(StudyFormAction.PARAM_STUDY)).thenReturn(value);
    }

    private void setStudyFormValueForValidation(String value) {
        MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();

        if (value != null) {
            formData.add(StudyFormAction.FIELD_USER_ATTR_STUDY, value);
        }

        when(validationContext.getHttpRequest().getDecodedFormParameters()).thenReturn(formData);
    }
}