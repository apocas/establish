require('colors');

exports.deploy = function(file, key) {
  try {
    var setup = require(file);
  } catch (err) {
    console.log('Setup/config file not found. (file: %s)'.red, file);
  }
};