/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { sequelize } = require('../db');

/**
 * A logical wrapper for (currently only) a database transaction
 *
 * @callback transactionCallback
 * @param {TransactionWrapper} t the new LogicTransaction
 */

class TransactionWrapper {
  /**
   * runs a new transaction
   * @param {transactionCallback} callback
   * @return {Promise<void>}
   */
  static async run(callback) {
    const t = new TransactionWrapper();
    return t._start(callback);
  }

  /**
   * starts the transaction
   * @param {transactionCallback} callback
   * @return {Promise<unknown>}
   * @private
   */
  _start(callback) {
    return sequelize.transaction(async (t) => {
      /**
       * The wrapped database transaction
       * @public
       * @type {import('sequelize').Transaction}
       */
      this.sqTransaction = t;
      return callback(this);
    });
  }

  /**
   * Resolves a sequelize transaction if present in options
   * @param {IOptions} options
   * @return {import('sequelize').Transaction|undefined}
   */
  static getSqTransactionFromOptions(options) {
    return options?.transaction?.sqTransaction;
  }
}

module.exports = TransactionWrapper;
