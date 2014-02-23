require('colors');

var read = require('read'),
  async = require('async'),
  Server = require('./server'),
  debug = require('debug')('network');

exports.deploy = function(file, key) {
  var setup;
  try {
    if(file.charAt(0) != '/') {
      file = process.cwd() + '/' + file;
    }
    setup = require(file);
  } catch (err) {
    throw new Error('Setup/config file not found. (file: ' + file + ')');
  }
  
  read({ prompt: 'passphrase: ', silent: true }, function(er, password) {
    handler(password);
  });

  var handler = function(passphrase) {
    async.eachSeries(setup, function(item, cb) {
      validateSetup(item);
      connect(item, key, passphrase, cb);
    }, function(err){
      if(err) throw err;
      console.log('Deployment ended!'.green);
    });
  };
};

var connect = function(setup, key, passphrase, cb) {
  var s = new Server(setup.host, setup.port || 22, setup.user || 'root', key, passphrase);
  s.on('ready', function() {
    console.log('[%s] Deployment starting.'.green, setup.name);
    console.log('[%s] Connected to %s'.green, setup.name, setup.host);
    
    async.waterfall([
      function(callback){
        clone(s, setup, callback);
      },
      function(callback){
        checkout(s, setup, callback);
      },
      function(callback){
        install(s, setup, callback);
      },
      function(callback){
        execute(s, setup, callback);
      },
    ], function (err, result) {
      s.end();
      cb();
    });
  });
};

var clone = function(s, setup, cb) {
  s.run('git clone ' + setup.repo + ' ' + setup.folder, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0 && code !== 128) {
        throw new Error('[' + setup.name + '] Cloning failed! (' + code + ')');
      } else {
        if(code == 128) {
          console.log('[%s] Repo exists, continuing (%d)'.yellow, setup.name, code);
        } else {
          console.log('[%s] Checkout successfully! (%d)'.green, setup.name, code);
        }
      }
      cb();
    });
  });
};

var checkout = function(s, setup, cb) {
  var tag = setup.tag || 'master';
  s.run('cd ' + setup.folder + '; git checkout ' + tag, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) {
        throw new Error('[' + setup.name + '] Checkout failed! (' + code + ')');
      }
      console.log('[%s] Checkout %s successfully! (%d)'.green, setup.name, tag, code);
      cb();
    });
  });
};

var install = function(s, setup, cb) {
  s.run('cd ' + setup.folder + '; npm install', function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) {
        throw new Error('[' + setup.name + '] Npm install failed! (' + code + ')');
      }
      console.log('[%s] Npm install successfully! (%d)'.green, setup.name, code);
      cb();
    });
  });
};

var execute = function(s, setup, cb) {
  s.run(processEnv(setup) + 'cd ' + setup.folder + '; npm start', function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) {
        throw new Error('[' + setup.name + '] Execute failed! (' + code + ')');
      }
      console.log('[%s] Execute successfully! (%d)'.green, setup.name, code);
      cb();
    });
  });
};

var processEnv = function(setup) {
  var output = '';
  if(setup.env) {
    var keys = Object.keys(setup.env);
    for (var i = keys.length - 1; i >= 0; i--) {
      output += 'export ' + keys[i] + '=' +setup.env[keys[i]] + '; ';
    }
  }
  return output;
};

var validateSetup = function(setup) {
  if(!setup.name) throw new Error('Name not specified.');
  if(!setup.repo) throw new Error('Repo not specified in ' + setup.name);
  if(!setup.folder) throw new Error('Folder not specified in ' + setup.name);
};