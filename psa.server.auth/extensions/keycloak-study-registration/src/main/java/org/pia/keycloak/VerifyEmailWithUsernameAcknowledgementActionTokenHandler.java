/*
 * SPDX-FileCopyrightText: 2004 Red Hat, Inc. and/or its affiliates and other contributors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This file has been modified:
 *  - create a custom implementation of VerifyEmailActionTokenHandler
 *  - always remove auth session after successful verification
 *  - show custom success message with username
 */
package org.pia.keycloak;

import org.keycloak.authentication.actiontoken.AbstractActionTokenHandler;
import org.keycloak.TokenVerifier.Predicate;
import org.keycloak.authentication.actiontoken.*;
import org.keycloak.events.*;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.Constants;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserModel.RequiredAction;
import org.keycloak.services.Urls;
import org.keycloak.services.managers.AuthenticationSessionManager;
import org.keycloak.services.messages.Messages;
import org.keycloak.sessions.AuthenticationSessionCompoundId;
import org.keycloak.sessions.AuthenticationSessionModel;
import java.util.Objects;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.core.UriInfo;

/**
 * Action token handler for verification of e-mail address.
 * @author hmlnarik
 */
public class VerifyEmailWithUsernameAcknowledgementActionTokenHandler extends AbstractActionTokenHandler<VerifyEmailWithUsernameAcknowledgementActionToken> {

    public VerifyEmailWithUsernameAcknowledgementActionTokenHandler() {
        super(
          VerifyEmailWithUsernameAcknowledgementActionToken.TOKEN_TYPE,
          VerifyEmailWithUsernameAcknowledgementActionToken.class,
          Messages.STALE_VERIFY_EMAIL_LINK,
          EventType.VERIFY_EMAIL,
          Errors.INVALID_TOKEN
        );
    }

    @Override
    public Predicate<? super VerifyEmailWithUsernameAcknowledgementActionToken>[] getVerifiers(ActionTokenContext<VerifyEmailWithUsernameAcknowledgementActionToken> tokenContext) {
        return TokenUtils.predicates(
          TokenUtils.checkThat(
            t -> Objects.equals(t.getEmail(), tokenContext.getAuthenticationSession().getAuthenticatedUser().getEmail()),
            Errors.INVALID_EMAIL, getDefaultErrorMessage()
          )
        );
    }

    @Override
    public Response handleToken(VerifyEmailWithUsernameAcknowledgementActionToken token, ActionTokenContext<VerifyEmailWithUsernameAcknowledgementActionToken> tokenContext) {
        UserModel user = tokenContext.getAuthenticationSession().getAuthenticatedUser();
        EventBuilder event = tokenContext.getEvent();

        event.event(EventType.VERIFY_EMAIL).detail(Details.EMAIL, user.getEmail());

        AuthenticationSessionModel authSession = tokenContext.getAuthenticationSession();
        final UriInfo uriInfo = tokenContext.getUriInfo();
        final RealmModel realm = tokenContext.getRealm();
        final KeycloakSession session = tokenContext.getSession();

        if (tokenContext.isAuthenticationSessionFresh()) {
            // Update the authentication session in the token
            token.setCompoundOriginalAuthenticationSessionId(token.getCompoundAuthenticationSessionId());

            String authSessionEncodedId = AuthenticationSessionCompoundId.fromAuthSession(authSession).getEncodedId();
            token.setCompoundAuthenticationSessionId(authSessionEncodedId);
            UriBuilder builder = Urls.actionTokenBuilder(uriInfo.getBaseUri(), token.serialize(session, realm, uriInfo),
                    authSession.getClient().getClientId(), authSession.getTabId());
            String confirmUri = builder.build(realm.getName()).toString();

            return session.getProvider(LoginFormsProvider.class)
                    .setAuthenticationSession(authSession)
                    .setSuccess(Messages.CONFIRM_EMAIL_ADDRESS_VERIFICATION, user.getEmail())
                    .setAttribute(Constants.TEMPLATE_ATTR_ACTION_URI, confirmUri)
                    .createInfoPage();
        }

        // verify user email as we know it is valid as this entry point would never have gotten here.
        user.setEmailVerified(true);
        user.removeRequiredAction(RequiredAction.VERIFY_EMAIL);
        authSession.removeRequiredAction(RequiredAction.VERIFY_EMAIL);

        event.success();

        AuthenticationSessionManager asm = new AuthenticationSessionManager(tokenContext.getSession());
        asm.removeAuthenticationSession(tokenContext.getRealm(), authSession, true);

        return tokenContext.getSession().getProvider(LoginFormsProvider.class)
                .setAuthenticationSession(authSession)
                .setSuccess(
                        StudyRegistrationMessages.EMAIL_VERIFIED_WITH_USERNAME_ACKNOWLEDGEMENT,
                        authSession.getAuthenticatedUser().getUsername())
                .createInfoPage();
    }

}
