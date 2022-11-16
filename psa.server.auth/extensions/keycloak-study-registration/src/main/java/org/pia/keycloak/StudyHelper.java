/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

package org.pia.keycloak;

import org.keycloak.models.*;

import java.util.HashSet;

public class StudyHelper {
    public static String REGISTRATION_LIMIT_KEY = "maxAccountsCount";
    private final KeycloakSession session;
    private String study;
    private RealmModel realm;

    private GroupModel studyGroup;

    public StudyHelper(KeycloakSession session) {
        this.session = session;
    }

    public void init(RealmModel realm, String study) {
        this.realm = realm;
        this.study = study;

        this.studyGroup = this.session.groups().getGroupById(realm, study);
    }

    public boolean studyGroupIsOpen() {
        return studyGroup != null && studyGroup.getFirstAttribute(REGISTRATION_LIMIT_KEY) != null;
    }

    public boolean reachedRegistrationLimit() {
        int limit = getRegistrationLimit();

        if(limit == -1) {
            return false;
        }

        return getUsersCount() >= limit;
    }

    public int getUsersCount() {
        HashSet<String> studies = new HashSet<>();
        studies.add(study);

        return session.users().getUsersCount(realm, studies);
    }

    public int getRegistrationLimit() {
        String registrationLimitAttr = studyGroup.getFirstAttribute(REGISTRATION_LIMIT_KEY);

        if(registrationLimitAttr == null || registrationLimitAttr.equals("")) {
            return -1;
        }

       return Integer.parseInt(registrationLimitAttr);
    }
}
