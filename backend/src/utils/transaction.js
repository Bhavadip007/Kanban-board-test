const mongoose = require('mongoose');

const isTransactionNotSupported = (err) =>
  err?.message?.includes('Transaction numbers are only allowed') ||
  err?.codeName === 'IllegalOperation';

const runWithTransaction = async (fn) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (isTransactionNotSupported(err)) {
      return fn(null);
    }

    throw err;
  } finally {
    session.endSession();
  }
};

const sessionOpts = (session) => (session ? { session } : {});

const applySession = (query, session) => (session ? query.session(session) : query);

module.exports = { runWithTransaction, sessionOpts, applySession };
