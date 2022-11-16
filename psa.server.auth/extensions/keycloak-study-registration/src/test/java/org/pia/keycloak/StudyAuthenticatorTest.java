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
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;

import javax.ws.rs.core.Response;

import static org.mockito.Mockito.*;

class StudyAuthenticatorTest {
    private StudyHelper studyHelper;
    private StudyAuthenticator studyAuthenticator;
    private AuthenticationFlowContext context;
    private Response response;

    @BeforeEach
    void setUp() {
        context = mock(AuthenticationFlowContext.class, RETURNS_DEEP_STUBS);
        studyHelper = mock(StudyHelper.class, RETURNS_DEEP_STUBS);
        studyAuthenticator = new StudyAuthenticator(studyHelper);
        response = mock(Response.class);
        when(context.form().setError(any()).createErrorPage(any())).thenReturn(response);
    }

    @ParameterizedTest
    @DisplayName("Should fail without study parameter")
    @NullSource
    @EmptySource
    void authenticateWithoutStudyParameter(String study) {
        setStudyParam(study);

        studyAuthenticator.authenticate(context);

        verify(context.form()).setError(StudyRegistrationMessages.STUDY_MISSING);
        verify(context.form().setError(StudyRegistrationMessages.STUDY_MISSING)).createErrorPage(Response.Status.BAD_REQUEST);

        verify(context).failure(
                AuthenticationFlowError.ACCESS_DENIED,
                response
        );

        verify(studyHelper, never()).init(any(), any());
    }

    @Test
    @DisplayName("Should fail when study is closed")
    void authenticateStudyGroupClosed() {
        setStudyParam("123-456-789");
        when(studyHelper.studyGroupIsOpen()).thenReturn(false);

        studyAuthenticator.authenticate(context);

        verify(studyHelper).init(any(), any());
        verify(context.form()).setError(StudyRegistrationMessages.STUDY_NOT_OPEN);
        verify(context.form().setError(StudyRegistrationMessages.STUDY_NOT_OPEN)).createErrorPage(Response.Status.FORBIDDEN);

        verify(context).failure(
                AuthenticationFlowError.ACCESS_DENIED,
                response
        );
    }

    @Test
    @DisplayName("Should fail when registration limit has been reached")
    void authenticateRegistrationLimitReached() {
        setStudyParam("123-456-789");
        when(studyHelper.studyGroupIsOpen()).thenReturn(true);
        when(studyHelper.reachedRegistrationLimit()).thenReturn(true);

        studyAuthenticator.authenticate(context);

        verify(studyHelper).init(any(), any());
        verify(context.form()).setError(StudyRegistrationMessages.LIMIT_REACHED);
        verify(context.form().setError(StudyRegistrationMessages.LIMIT_REACHED)).createErrorPage(Response.Status.FORBIDDEN);

        verify(context).failure(
                AuthenticationFlowError.ACCESS_DENIED,
                response
        );
    }

    @Test
    @DisplayName("Should succeed")
    void authenticateSuccessfully() {
        String studyId = "123-456-789";
        setStudyParam(studyId);
        when(studyHelper.studyGroupIsOpen()).thenReturn(true);
        when(studyHelper.reachedRegistrationLimit()).thenReturn(false);

        studyAuthenticator.authenticate(context);

        verify(studyHelper).init(any(), any());
        verify(context.getAuthenticationSession()).setUserSessionNote(StudyFormAction.PARAM_STUDY, studyId);
        verify(context).success();
    }

    private void setStudyParam(String parameter) {
        when(context.getHttpRequest().getUri().getQueryParameters().getFirst(StudyFormAction.PARAM_STUDY)).thenReturn(parameter);
    }
}