const mongoose = require('mongoose');

// لو اتبعتلها session جاهزة (من عملية أكبر) بتشتغل جواها،
// وإلا بتفتح transaction جديدة وتقفلها بنفسها.
async function withSession(externalSession, work) {
  if (externalSession) return work(externalSession);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { withSession };