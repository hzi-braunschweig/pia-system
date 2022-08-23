import sinon from 'sinon';
import { Response as SuperagentResponse } from 'superagent';
export declare type SinonMethodStub<M extends (...args: any[]) => any> = sinon.SinonStub<Parameters<M>, ReturnType<M>>;
export declare type Response<T> = Omit<SuperagentResponse, 'body'> & {
    body: T;
};
export declare type JsonPresenterResponse<T> = Response<{
    links: {
        self: {
            href: string;
        };
    };
} & T>;
