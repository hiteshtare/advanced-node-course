const mongoose = require('mongoose');

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = function () {
  console.log('I will run before executing any query');
  return exec.apply(this, arguments);
};