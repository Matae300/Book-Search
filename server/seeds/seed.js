const db = require('../config/connection');
const { User } = require('../models');
const userSeeds = require('./userData.json');
const cleanDB = require('./cleanDB');

db.once('open', async () => {
  await cleanDB('User', 'users');

  await User.create(userSeeds);

  console.log('all done!');
  process.exit(0);
});
