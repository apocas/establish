require('colors');

var read = require('read'),
  async = require('async'),
  Server = require('./server'),
  debug = require('debug')('network'),
  path = require('path'),
  workflow = require('./workflow');

exports.deploy = function(file, project, key) {
  var setup;
  try {
    file = path.resolve(process.cwd(), file);
    setup = require(file);
  } catch (err) {
    throw new Error('Setup/config file not found. (file: ' + file + ')');
  }
  
  read({ prompt: 'passphrase: ', silent: true }, function(er, password) {
    handler(password);
  });

  var handler = function(passphrase) {
    var proj = findProject(setup, project);
    if(proj) {
      validateSetup(proj);
      connect(proj, key, passphrase, cb);
    } else {
      async.eachSeries(setup, function(item, cb) {
        validateSetup(item);
        connect(item, key, passphrase, cb);
      }, function(err){
        if(err) throw err;
        console.log('Deployment finished successfully!'.green);
      });
    }
  };
};

var connect = function(setup, key, passphrase, cb) {
  var s = new Server(setup.host, setup.port || 22, setup.user || 'root', key, passphrase);
  s.on('ready', function() {
    console.log('[%s] Deployment starting.'.green, setup.name);
    console.log('[%s] Connected to %s'.green, setup.name, setup.host);

    async.waterfall([
      function(callback){
        if(setup.repo) {
          workflow.clone(s, setup, callback);
        } else {
          workflow.compress(s, setup, callback);
        }
      },
      function(callback){
        if(setup.repo) {
          workflow.checkout(s, setup, callback);
        } else {
          callback();
        }
      },
      function(callback){
        workflow.install(s, setup, callback);
      },
      function(callback){
        if(setup.run !== 'false' && setup.run !== false) {
          workflow.execute(s, setup, callback);
        } else {
          console.log('[%s] Skipping run as specified.'.green, setup.name);
          callback();
        }
      },
    ], function (err, result) {
      s.end();
      cb();
    });
  });
};



var validateSetup = function(setup) {
  if(!setup.name) throw new Error('Name not specified.');
  if(!setup.repo && !setup.folder) throw new Error('Repo or folder not specified in ' + setup.name);
  if(!setup.destination) throw new Error('Folder not specified in ' + setup.name);
};

var findProject = function(setup, name) {
  for (var i = setup.length - 1; i >= 0; i--) {
    if(setup[i].name == name) {
      return setup[i];
    }
  }
  return undefined;
};