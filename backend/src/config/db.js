const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  await mongoose.connect(config.mongodbUri);
};

module.exports = connectDB;
