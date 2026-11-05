const mongoose = require('mongoose');
const config = require('./config'); 

mongoose.connect(config.db.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});