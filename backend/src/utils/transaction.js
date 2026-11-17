const mongoose = require('mongoose');

function areTransactionsSupported() {
  try {
    const client = mongoose.connection?.getClient ? mongoose.connection.getClient() : mongoose.connection?.client;
    const description = client?.topology?.description;
    if (!description) return null;
    if (description.setName) return true;
    if (description.type === 'Single' && !description.setName) return false;
    if (['ReplicaSetWithPrimary', 'ReplicaSetNoPrimary', 'Sharded'].includes(description.type)) {
      return true;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Runs a callback inside a MongoDB multi-document transaction.
 * If MongoDB is running in standalone mode (single node without replica set, common in local dev),
 * transactions are not supported by the engine, so it gracefully executes the callback without a transaction session.
 * @param {Function} fn - async function receiving (session)
 * @returns {Promise<*>} result of the callback
 */
async function runInTransaction(fn) {
  if (areTransactionsSupported() === false) {
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    if (
      err?.code === 20 ||
      err?.codeName === 'IllegalOperation' ||
      (typeof err?.message === 'string' && err.message.includes('replica set member'))
    ) {
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

module.exports = { runInTransaction };
