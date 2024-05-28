/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import { MarkRequired } from 'ts-essentials';
import { asyncMap } from '@pia/lib-service-core';
import { adminAuthClient } from '../clients/authServerClient';
import { ApiClient } from '../models/apiClientDto';
import { ApiClientAlreadyExistsError, ApiClientNotFoundError } from '../errors';
import { StatusCodes } from 'http-status-codes';

export type SafeClientRepresentation = MarkRequired<
  ClientRepresentation,
  'id' | 'clientId' | 'name' | 'secret'
>;

export type SafeUserRepresentation = MarkRequired<UserRepresentation, 'id'>;

export type SafeGroupRepresentation = MarkRequired<
  GroupRepresentation,
  'id' | 'name'
>;

interface AdminAuthClientError {
  response: {
    status: number;
  };
}

export class ApiClientService {
  private static readonly apiClientPrefix = 'pia-public-api-';
  private static readonly createdAtAttributeKey = 'pia.createdAt';

  public static async getApiClients(): Promise<ApiClient[]> {
    const clients = (
      await adminAuthClient.clients.find({
        first: 0,
        max: 11,
        clientId: this.apiClientPrefix,
        realm: adminAuthClient.realm,
        search: true,
      })
    )
      .filter(this.isSafeClientRepresentation)
      .filter((client) => client.clientId.startsWith(this.apiClientPrefix));

    return await asyncMap(clients, async (client) =>
      this.mapSafeClientRepresentationToApiClient(client)
    );
  }

  public static async createApiClient(client: {
    name: string;
    studies: string[];
  }): Promise<ApiClient> {
    try {
      const { id } = await adminAuthClient.clients.create({
        realm: adminAuthClient.realm,
        clientId: this.apiClientPrefix + this.toKebabCase(client.name),
        protocol: 'openid-connect',
        name: client.name,
        description: '',
        publicClient: false,
        authorizationServicesEnabled: false,
        serviceAccountsEnabled: true,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: false,
        standardFlowEnabled: false,
        frontchannelLogout: true,
        attributes: {
          [this.createdAtAttributeKey]: new Date().toISOString(),
        },
      });
      await this.addGroupMembershipsToTokenOfClient(id);
      await this.addGroupMembershipsToClient(id, client.studies);
      return await this.getApiClient(id);
    } catch (error) {
      if (
        ApiClientService.isAdminAuthClientError(error) &&
        error.response.status === StatusCodes.CONFLICT
      ) {
        throw new ApiClientAlreadyExistsError();
      }
      console.error(error);
      throw new Error('Could not create api client due to an unknown error');
    }
  }

  public static async deleteApiClient(clientId: string): Promise<void> {
    const clients = await adminAuthClient.clients.find({
      first: 0,
      max: 1,
      clientId,
      realm: adminAuthClient.realm,
      search: false,
    });
    if (clients.length <= 0 || !clients[0]?.id) {
      throw new ApiClientNotFoundError(`The client ${clientId} does not exist`);
    }
    await adminAuthClient.clients.del({
      id: clients[0].id,
      realm: adminAuthClient.realm,
    });
  }

  private static async getApiClient(id: string): Promise<ApiClient> {
    const createdClient = await adminAuthClient.clients.findOne({
      id,
      realm: adminAuthClient.realm,
    });
    if (!createdClient || !this.isSafeClientRepresentation(createdClient)) {
      throw new Error(`An error occurred while creating the client ${id}`);
    }
    return await this.mapSafeClientRepresentationToApiClient(createdClient);
  }

  private static async getServiceAccountUserOrFail(
    clientOuid: string
  ): Promise<SafeUserRepresentation> {
    const serviceAccount = await adminAuthClient.clients.getServiceAccountUser({
      id: clientOuid,
      realm: adminAuthClient.realm,
    });
    if (!this.isSafeUserRepresentation(serviceAccount)) {
      throw new Error(
        `The service account of client ${clientOuid} is not a safe user representation`
      );
    }
    return serviceAccount;
  }

  private static async getGroupMembershipsOfClient(
    clientOuid: string
  ): Promise<string[]> {
    const serviceAccount = await this.getServiceAccountUserOrFail(clientOuid);
    return (
      await adminAuthClient.users.listGroups({
        id: serviceAccount.id,
        realm: adminAuthClient.realm,
      })
    )
      .filter(this.isSafeGroupRepresentation)
      .map((group) => group.name);
  }

  private static async addGroupMembershipsToClient(
    clientOuid: string,
    groups: string[]
  ): Promise<void> {
    const serviceAccount = await this.getServiceAccountUserOrFail(clientOuid);
    await asyncMap(groups, async (groupName) => {
      const { id } = await this.getGroupByNameOrFail(groupName);
      await adminAuthClient.users.addToGroup({
        id: serviceAccount.id,
        realm: adminAuthClient.realm,
        groupId: id,
      });
    });
  }

  private static async getGroupByNameOrFail(
    groupName: string
  ): Promise<SafeGroupRepresentation> {
    const availableGroups = await adminAuthClient.groups.find({
      realm: adminAuthClient.realm,
      briefRepresentation: true,
    });
    const groupRepresentation = availableGroups.find(
      (group) => group.name === groupName
    );
    if (
      !groupRepresentation ||
      !this.isSafeGroupRepresentation(groupRepresentation)
    ) {
      throw new Error('Requested access to unknown group');
    }
    return groupRepresentation;
  }

  private static async addGroupMembershipsToTokenOfClient(
    clientOuid: string
  ): Promise<void> {
    await adminAuthClient.clients.addProtocolMapper(
      {
        id: clientOuid,
        realm: adminAuthClient.realm,
      },
      {
        protocol: 'openid-connect',
        protocolMapper: 'oidc-group-membership-mapper',
        name: 'studies',
        config: {
          'claim.name': 'studies',
          'full.path': 'false',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'userinfo.token.claim': 'true',
        },
      }
    );
  }

  private static async mapSafeClientRepresentationToApiClient(
    client: SafeClientRepresentation
  ): Promise<ApiClient> {
    return {
      clientId: client.clientId,
      name: client.name,
      studies: await this.getGroupMembershipsOfClient(client.id),
      secret: client.secret,
      createdAt: client.attributes?.[this.createdAtAttributeKey] as string,
    };
  }

  private static toKebabCase(value: string): string {
    return value
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase();
  }

  private static isSafeClientRepresentation(
    this: void,
    client: ClientRepresentation
  ): client is SafeClientRepresentation {
    return !!client.id && !!client.clientId && !!client.name && !!client.secret;
  }

  private static isSafeUserRepresentation(
    this: void,
    user: UserRepresentation
  ): user is SafeUserRepresentation {
    return !!user.id;
  }

  private static isSafeGroupRepresentation(
    this: void,
    group: GroupRepresentation
  ): group is SafeGroupRepresentation {
    return !!group.id && !!group.name;
  }

  private static isAdminAuthClientError(
    error: unknown
  ): error is AdminAuthClientError {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as AdminAuthClientError).response;
      return (
        typeof response === 'object' &&
        'status' in response &&
        typeof response.status === 'number'
      );
    }
    return false;
  }
}
