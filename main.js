#!/usr/bin/env node
require('colors');

var d = require('domain').create();

var instructions = require('./lib/instructions');
var argv = require('minimist')(process.argv.slice(2));

var command = 'deploy';
var file;
var key = argv.key || process.env['HOME'] + '/.ssh/id_rsa';
var project = argv.project;


d.on('error', function(error) {
  console.log('%s'.red, error);
  process.exit(1);
});

d.run(function() {
  if(argv._.length == 2) {
    command = argv._[0];
    file = argv._[1];
  } else if(argv._.length == 1) {
    file = argv._[0];
  } else {
    throw new Error('Humm... weird parameters.');
  }

  switch(command) {
    case 'deploy':
      instructions.deploy(file, project, key);
      break;
    case 'restart':
      instructions.restart(file, project, key);
      break;
    case 'stop':
      instructions.stop(file, project, key);
      break;
    default:
      console.log('Unknown command.');
  }
});