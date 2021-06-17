import { expect } from 'chai';
import { IDatabase } from 'pg-promise';
import sinon from 'sinon';
import { mock } from 'ts-mockito';

import { createTransactionRunner } from './transactionRunnerFactory';

describe('createTransactionRunner()', () => {
  it('should return a pgPromise transaction object', async () => {
    const transaction = {};
    const db = mock<IDatabase<unknown>>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    db.tx = sinon.stub().callsFake((callback) => callback(transaction));
    const runTransaction = createTransactionRunner(db);
    const txCallback = sinon.stub();
    await runTransaction(txCallback);
    expect((db.tx as sinon.SinonStub).calledOnce).to.be.true;
    expect(txCallback.calledOnce).to.be.true;
    expect(txCallback.calledWith(transaction)).to.be.true;
  });
});
