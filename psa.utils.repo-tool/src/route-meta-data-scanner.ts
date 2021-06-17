import { Fs } from './fs';
import * as util from 'util';
import csv from 'csv-stringify';
import fetch from 'node-fetch';
import {
  OpenAPIObject,
  OperationObject,
  PathItemObject,
  PathsObject,
} from 'openapi3-ts';

const csvStringify = util.promisify(csv as any);

interface RouteMetaData {
  service: string;
  host: string;
  path: string;
  method: string;
  scope: 'external' | 'internal';
  description: string | undefined;
}

export class RouteMetaDataScanner {
  private static readonly MICROSERVICES_PORT_START = 4000;
  private static readonly MICROSERVICES_PORT_END = 4015;

  private static readonly CSV_FILE_NAME = 'route-meta-data.csv';

  private static readonly SUPPORTED_API_METHODS: Array<
    Extract<keyof PathItemObject, string>
  > = ['get', 'put', 'post', 'delete', 'patch'];

  private static mapSpecToRouteMetaData(spec: OpenAPIObject): RouteMetaData[] {
    const serviceName = spec.info.title.replace('API Documentation ', '');
    return this.mapApiPathToRouteMetaData(serviceName, spec.host, spec.paths);
  }

  private static mapApiPathToRouteMetaData(
    service: string,
    host: string,
    paths: PathsObject
  ): RouteMetaData[] {
    return Object.keys(paths).flatMap((path) =>
      this.mapApiPathItemToRouteMetaData(service, host, path, paths[path])
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
        pathItems[method]
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

  private static async createCsv(
    routeMetaData: RouteMetaData[]
  ): Promise<string> {
    return (await csvStringify(routeMetaData, {
      delimiter: ';',
      header: true,
    })) as string;
  }

  public static async scan(): Promise<void> {
    let routeMetaData: RouteMetaData[] = [];
    for (
      let port = this.MICROSERVICES_PORT_START;
      port < this.MICROSERVICES_PORT_END;
      port++
    ) {
      try {
        const url = 'http://localhost:' + port + '/swagger.json';
        const response = await fetch(url);
        if (response.ok) {
          console.log('response ok: ', url);
          const spec: OpenAPIObject = await response.json();
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
    const csv = await RouteMetaDataScanner.createCsv(routeMetaData);
    await Fs.writeFile(process.env.OUT_FILE || this.CSV_FILE_NAME, csv);
    console.log('------------------------------------');
    console.log('wrote output to:', this.CSV_FILE_NAME);
  }
}
