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
 *  - create a custom implementation of VerifyEmailActionToken
 */

package org.pia.keycloak;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.keycloak.authentication.actiontoken.DefaultActionToken;

/**
 * Representation of a token that represents a time-limited verify e-mail action.
 *
 * @author hmlnarik
 */
public class VerifyEmailWithUsernameAcknowledgementActionToken extends DefaultActionToken {

    public static final String TOKEN_TYPE = "verify-email";

    private static final String JSON_FIELD_ORIGINAL_AUTHENTICATION_SESSION_ID = "oasid";

    @JsonProperty(value = JSON_FIELD_ORIGINAL_AUTHENTICATION_SESSION_ID)
    private String originalAuthenticationSessionId;

    public VerifyEmailWithUsernameAcknowledgementActionToken(String userId, int absoluteExpirationInSecs, String compoundAuthenticationSessionId, String email, String clientId) {
        super(userId, TOKEN_TYPE, absoluteExpirationInSecs, null, compoundAuthenticationSessionId);
        setEmail(email);
        this.issuedFor = clientId;
    }

    private VerifyEmailWithUsernameAcknowledgementActionToken() {
    }

    public String getCompoundOriginalAuthenticationSessionId() {
        return originalAuthenticationSessionId;
    }

    public void setCompoundOriginalAuthenticationSessionId(String originalAuthenticationSessionId) {
        this.originalAuthenticationSessionId = originalAuthenticationSessionId;
    }
}
