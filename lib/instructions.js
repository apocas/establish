require('colors');

var read = require('read'),
  async = require('async'),
  Server = require('./server'),
  debug = require('debug')('network'),
  path = require('path'),
  workflow = require('./workflow');


exports.deploy = function(file, project, key) {
  var setup = validateFile(file);

  var handler = function(passphrase) {
    var proj = findProject(setup, project);

    if(proj) {
      validateSetup(proj);
      var spree = constructDeploySpree(proj);
      connect(proj, key, passphrase, spree);
    } else {
      async.eachSeries(setup, function(item, cb) {
        validateSetup(item);
        var spree = constructDeploySpree(item, cb);
        connect(item, key, passphrase, spree, cb);
      }, function(err){
        if(err) throw err;
        console.log('Deployment finished successfully!'.green);
      });
    }
  };

  readPassword(handler);
};


exports.restart = function(file, project, key) {
  var setup = validateFile(file);

  var handler = function(passphrase) {
    var proj = findProject(setup, project);

    if(proj) {
      validateSetup(proj);
      var spree = constructRestartSpree(proj);
      connect(proj, key, passphrase, spree);
    } else {
      async.eachSeries(setup, function(item, cb) {
        validateSetup(item);
        var spree = constructRestartSpree(item, cb);
        connect(item, key, passphrase, spree, cb);
      }, function(err){
        if(err) throw err;
        console.log('Restarted successfully!'.green);
      });
    }
  };

  readPassword(handler);
};


exports.start = function(file, project, key) {
  var setup = validateFile(file);

  var handler = function(passphrase) {
    var proj = findProject(setup, project);

    if(proj) {
      validateSetup(proj);
      var spree = constructStartSpree(proj);
      connect(proj, key, passphrase, spree);
    } else {
      async.eachSeries(setup, function(item, cb) {
        validateSetup(item);
        var spree = constructStartSpree(item, cb);
        connect(item, key, passphrase, spree, cb);
      }, function(err){
        if(err) throw err;
        console.log('Started successfully!'.green);
      });
    }
  };

  readPassword(handler);
};


exports.stop = function(file, project, key) {
  var setup = validateFile(file);

  var handler = function(passphrase) {
    var proj = findProject(setup, project);

    if(proj) {
      validateSetup(proj);
      var spree = constructStopSpree(proj);
      connect(proj, key, passphrase, spree);
    } else {
      async.eachSeries(setup, function(item, cb) {
        validateSetup(item);
        var spree = constructStopSpree(item, cb);
        connect(item, key, passphrase, spree, cb);
      }, function(err){
        if(err) throw err;
        console.log('Stopped successfully!'.green);
      });
    }
  };

  readPassword(handler);
};


var constructDeploySpree = function(proj, callback) {
  return function(s) {
    return [
      function(callback){
        if(proj.repo) {
          workflow.clone(s, proj, callback);
        } else {
          workflow.compress(s, proj, callback);
        }
      },
      function(callback){
        if(proj.repo) {
          workflow.checkout(s, proj, callback);
        } else {
          callback();
        }
      },
      function(callback){
        workflow.install(s, proj, callback);
      },
      function(callback){
        if(proj.run !== 'false' && proj.run !== false) {
          workflow.execute(s, proj, callback);
        } else {
          console.log('[%s] Skipping run as specified.'.green, proj.name);
          callback();
        }
      }
    ];
  };
};


var constructStartSpree = function(proj, callback) {
  return function(s) {
    return [
      function(callback){
        workflow.execute(s, proj, callback);
      }
    ];
  };
};


var constructRestartSpree = function(proj, callback) {
  return function(s) {
    return [
      function(callback){
        workflow.restart(s, proj, callback);
      }
    ];
  };
};


var constructStopSpree = function(proj, callback) {
  return function(s) {
    return [
      function(callback){
        workflow.stop(s, proj, callback);
      }
    ];
  };
};

var readPassword = function(handler) {
  read({ prompt: 'passphrase: ', silent: true }, function(er, password) {
    handler(password);
  });
};


var validateFile = function(file) {
  try {
    file = path.resolve(process.cwd(), file);
    return require(file);
  } catch (err) {
    throw new Error('Setup/config file not found or invalid. (file: ' + file + ')');
  }
};


var connect = function(setup, key, passphrase, spree, cb) {
  var s = new Server(setup.host, setup.port || 22, setup.user || 'root', key, passphrase);

  s.on('ready', function() {
    console.log(' ---------- ');
    console.log('[%s] Connected to %s'.green, setup.name, setup.host);

    async.waterfall(spree(s), function (err, result) {
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