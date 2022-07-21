/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import sinon from 'sinon';
import { Response as SuperagentResponse } from 'superagent';

/**
 * Allows to declare the type of a single method's stub.
 *
 * @example
 * let getSomethingMock: SinonMethodStub<typeof ExampleRepository.getSomething>
 *     = sandbox.stub(ExampleRepository, 'getSomething');
 */
export type SinonMethodStub<M extends (...args: any[]) => any> =
  sinon.SinonStub<Parameters<M>, ReturnType<M>>;

/**
 * Allows to declare the response body type within Tests
 */
export type Response<T> = Omit<SuperagentResponse, 'body'> & {
  body: T;
};

/**
 * Generic type of API responses with hypermedia links to itself
 */
export type JsonPresenterResponse<T> = Response<
  { links: { self: { href: string } } } & T
>;
