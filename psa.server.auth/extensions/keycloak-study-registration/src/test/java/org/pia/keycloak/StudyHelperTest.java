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
import org.keycloak.models.GroupModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.*;

class StudyHelperTest {
    private StudyHelper studyHelper;
    private RealmModel realmModel;
    private KeycloakSession keycloakSession;
    private GroupModel groupModel;

    @BeforeEach
    void setUp() {
        realmModel = mock(RealmModel.class);
        keycloakSession = mock(KeycloakSession.class, RETURNS_DEEP_STUBS);
        groupModel = mock(GroupModel.class);

        studyHelper = new StudyHelper(keycloakSession);
    }

    @ParameterizedTest
    @DisplayName("Check if study group is open for registration")
    @MethodSource("studyGroupIsOpenProvider")
    void studyGroupIsOpen(GroupModel group, String limit, Boolean expected) {
        if (group != null) {
            when(group.getFirstAttribute(StudyHelper.REGISTRATION_LIMIT_KEY)).thenReturn(limit);
        }

        when(keycloakSession.groups().getGroupById(any(), anyString())).thenReturn(group);

        studyHelper.init(realmModel, "study");

        assertEquals(expected, studyHelper.studyGroupIsOpen());
    }

    static Stream<Arguments> studyGroupIsOpenProvider() {
        return Stream.of(
                arguments(mock(GroupModel.class), "123", true),
                arguments(null, "123", false),
                arguments(mock(GroupModel.class), null, false),
                arguments(null, null, false)
        );
    }

    @ParameterizedTest
    @DisplayName("Check if study group has reached its registration limit")
    @MethodSource("reachedRegistrationLimitProvider")
    void reachedRegistrationLimit(int limit, int usersCount, boolean expected) {
        StudyHelper studyHelperSpy = spy(studyHelper);
        doReturn(limit).when(studyHelperSpy).getRegistrationLimit();
        doReturn(usersCount).when(studyHelperSpy).getUsersCount();

        assertEquals(expected, studyHelperSpy.reachedRegistrationLimit());
    }

    static Stream<Arguments> reachedRegistrationLimitProvider() {
        return Stream.of(
                arguments(100, 100, true),
                arguments(100, 101, true),
                arguments(100, 99, false),
                arguments(100, 1, false),
                arguments(100, 0, false),
                arguments(-1, 100, false),
                arguments(-1, 50, false),
                arguments(-1, 0, false)
        );
    }

    @Test
    @DisplayName("Return count of active users")
    void getUsersCount() {
        int expected = 123;
        when(keycloakSession.users().getUsersCount(any(), anySet())).thenReturn(expected);
        assertEquals(expected, studyHelper.getUsersCount());
    }

    @ParameterizedTest
    @DisplayName("Return the registration limit from study group")
    @MethodSource("getRegistrationLimitProvider")
    void getRegistrationLimit(String attributeValue, int expected) {
        when(groupModel.getFirstAttribute(StudyHelper.REGISTRATION_LIMIT_KEY)).thenReturn(attributeValue);
        when(keycloakSession.groups().getGroupById(any(), anyString())).thenReturn(groupModel);

        studyHelper.init(realmModel, "study");

        assertEquals(expected, studyHelper.getRegistrationLimit());
    }

    static Stream<Arguments> getRegistrationLimitProvider() {
        return Stream.of(
                arguments("123", 123),
                arguments("0", 0),
                arguments(null, -1),
                arguments("", -1)
        );
    }
}