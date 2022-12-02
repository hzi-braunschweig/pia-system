/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Fs } from './fs';
import csvStringify from 'csv-stringify/sync';
import fetch from 'node-fetch';
import {
  OpenAPIObject,
  OperationObject,
  PathItemObject,
  PathsObject,
} from 'openapi3-ts';

interface RouteMetaData {
  service: string;
  host: string;
  path: string;
  method: string;
  scope: 'external' | 'internal';
  description: string | undefined;
}

interface OpenAPIObjectWithHost extends OpenAPIObject {
  host: string;
}

export class RouteMetaDataScanner {
  private static readonly MICROSERVICES_PORT_START = 4000;
  private static readonly MICROSERVICES_PORT_END = 4015;

  private static readonly CSV_FILE_NAME = 'route-meta-data.csv';

  private static readonly SUPPORTED_API_METHODS: Extract<
    keyof PathItemObject,
    string
  >[] = ['get', 'put', 'post', 'delete', 'patch'];

  public static async scan(): Promise<void> {
    let routeMetaData: RouteMetaData[] = [];
    const initialTlsRejectUnauthorized =
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    for (
      let port = this.MICROSERVICES_PORT_START;
      port < this.MICROSERVICES_PORT_END;
      port++
    ) {
      try {
        const url = 'https://localhost:' + port.toString() + '/swagger.json';
        const response = await fetch(url);
        if (response.ok) {
          console.log('response ok: ', url);
          const spec: OpenAPIObjectWithHost =
            (await response.json()) as OpenAPIObjectWithHost;
          routeMetaData = [
            ...routeMetaData,
            ...this.mapSpecToRouteMetaData(spec),
          ];
        } else {
          console.log('response NOT ok:', url);
          console.log(await response.text());
        }
      } catch (e) {
        // nothing
      }
    }
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = initialTlsRejectUnauthorized;
    const csv = RouteMetaDataScanner.createCsv(routeMetaData);
    await Fs.writeFile(process.env['OUT_FILE'] ?? this.CSV_FILE_NAME, csv);
    console.log('------------------------------------');
    console.log('wrote output to:', this.CSV_FILE_NAME);
  }

  private static mapSpecToRouteMetaData(
    spec: OpenAPIObjectWithHost
  ): RouteMetaData[] {
    const serviceName = spec.info.title.replace('API Documentation ', '');
    return this.mapApiPathToRouteMetaData(serviceName, spec.host, spec.paths);
  }

  private static mapApiPathToRouteMetaData(
    service: string,
    host: string,
    paths: PathsObject
  ): RouteMetaData[] {
    return Object.keys(paths).flatMap((path) =>
      this.mapApiPathItemToRouteMetaData(
        service,
        host,
        path,
        paths[path] as PathItemObject
      )
    );
  }

  private static mapApiPathItemToRouteMetaData(
    service: string,
    host: string,
    path: string,
    pathItems: PathItemObject
  ): RouteMetaData[] {
    // only collect standard HTTP methods
    return this.SUPPORTED_API_METHODS.filter(
      (method) => !!pathItems[method]
    ).map((method) =>
      this.mapApiOperationToRouteMetaData(
        service,
        host,
        path,
        method,
        pathItems[method] as OperationObject
      )
    );
  }

  private static mapApiOperationToRouteMetaData(
    service: string,
    host: string,
    path: string,
    method: string,
    operation: OperationObject
  ): RouteMetaData {
    return {
      service,
      host,
      path,
      method,
      scope: 'external',
      description: operation.summary,
    };
  }

  private static createCsv(routeMetaData: RouteMetaData[]): string {
    return csvStringify.stringify(routeMetaData, {
      delimiter: ';',
      header: true,
    });
  }
}
