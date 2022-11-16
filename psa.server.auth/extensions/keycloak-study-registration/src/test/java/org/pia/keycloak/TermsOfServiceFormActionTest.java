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
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;

import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;

import java.util.stream.Stream;

import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.*;

class TermsOfServiceFormActionTest {

    private FormContext formContext;
    private ValidationContext validationContext;
    private KeycloakSession keycloakSession;
    private ClientModel clientModel;
    private LoginFormsProvider loginFormsProvider;

    @BeforeEach
    void setUp() {
        clientModel = mock(ClientModel.class);
        loginFormsProvider = mock(LoginFormsProvider.class);
        keycloakSession = mock(KeycloakSession.class, RETURNS_DEEP_STUBS);
        formContext = mock(FormContext.class, RETURNS_DEEP_STUBS);
        validationContext = mock(ValidationContext.class, RETURNS_DEEP_STUBS);

        when(keycloakSession.getContext().getClient()).thenReturn(clientModel);
    }

    @Test
    @DisplayName("Should set URIs as attributes")
    void buildPage() {
        String expectedTosUri = "https://tos.uri";
        String expectedPolicyUri = "https://policy.uri";

        setTosUrl(expectedTosUri);
        setPolicyUri(expectedPolicyUri);

        FormAction formAction = buildFormAction();
        formAction.buildPage(formContext, loginFormsProvider);

        verify(loginFormsProvider).setAttribute(TermsOfServiceFormAction.TOS_URI, expectedTosUri);
        verify(loginFormsProvider).setAttribute(TermsOfServiceFormAction.POLICY_URI, expectedPolicyUri);
    }

    @ParameterizedTest
    @DisplayName("Should succeed when all checkboxes are enabled and have been checked")
    @MethodSource("validateSuccess")
    void validateSuccess(String tosUri, String policyUri, String tosValue, String policyValue) {
        setTosUrl(tosUri);
        setPolicyUri(policyUri);

        setFormValues(tosValue, policyValue);

        FormAction formAction = buildFormAction();
        formAction.validate(validationContext);

        verify(validationContext).success();
    }

    static Stream<Arguments> validateSuccess() {
        return Stream.of(
                arguments("tos", "policy", "true", "true"), // tos and policy is required
                arguments("tos", null, "true", null), // only tos is required
                arguments(null, "policy", null, "true"), // only policy is required
                arguments(null, null, null, null) // nothing is required
        );
    }

    @ParameterizedTest
    @DisplayName("Should fail when TOS is not checked")
    @MethodSource("validateErrorProvider")
    void validateError(String tosUri, String policyUri, String tosValue, String policyValue) {
        setTosUrl(tosUri);
        setPolicyUri(policyUri);

        setFormValues(tosValue, policyValue);

        FormAction formAction = buildFormAction();
        formAction.validate(validationContext);

        if(tosUri != null && !tosUri.isEmpty() && (tosValue == null || tosValue.isEmpty())) {
            verify(validationContext).error(StudyRegistrationMessages.CONFIRM_TOS);
        }

        if(policyUri != null && !policyUri.isEmpty() && (policyValue == null || policyValue.isEmpty())) {
            verify(validationContext).error(StudyRegistrationMessages.CONFIRM_POLICY);
        }

        verify(validationContext).validationError(any(), any());
    }

    static Stream<Arguments> validateErrorProvider() {
        return Stream.of(
                // tos and policy is required
                arguments("tos", "policy", null, null),
                arguments("tos", "policy", null, "true"),
                arguments("tos", "policy", "true", null),
                // only tos is required
                arguments("tos", null, null, null),
                arguments("tos", null, null, "true"),
                // only policy is required
                arguments(null, "policy", null, null),
                arguments(null, "policy", "true", null)
        );
    }

    private TermsOfServiceFormAction buildFormAction() {
        return new TermsOfServiceFormAction(keycloakSession);
    }

    private void setFormValues(String tosValue, String policyValue) {
        MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();

        if (tosValue != null) {
            formData.add(TermsOfServiceFormAction.FIELDNAME_TOS_CONFIRM, tosValue);
        }

        if (policyValue != null) {
            formData.add(TermsOfServiceFormAction.FIELDNAME_POLICY_CONFIRM, policyValue);
        }

        when(validationContext.getHttpRequest().getDecodedFormParameters()).thenReturn(formData);
    }

    private void setTosUrl(String uri) {
        when(clientModel.getAttribute(ClientModel.TOS_URI)).thenReturn(uri);
    }

    private void setPolicyUri(String uri) {
        when(clientModel.getAttribute(ClientModel.POLICY_URI)).thenReturn(uri);
    }
}