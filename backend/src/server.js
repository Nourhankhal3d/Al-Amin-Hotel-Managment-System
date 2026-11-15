// Hotel Management Server
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./db/connect');
const { Setting } = require('./db/models');
const { setShiftHours } = require('./utils/time');

async function loadShiftHours() {
  try {
    const s = await Setting.findOne({ key: 'shifts' }).lean();
    if (s && !setShiftHours(s.value)) {
      console.warn('shift hours in Setting are invalid, keeping the current hours');
    }
  } catch (e) {
    console.warn('shift hours not loaded:', e.message);
  }
}

connectDB().then(async () => {
  await loadShiftHours();
  setInterval(loadShiftHours, 60000).unref();
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
});

