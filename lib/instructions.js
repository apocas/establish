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
    console.log('Setup/config file not found. (file: %s)'.red, file);
    process.exit(1);
  }
  
  read({ prompt: 'Password: ', silent: true }, function(er, password) {
    handler(password);
  });

  var handler = function(passphrase) {
    async.eachSeries(setup, function(item, cb) {
      connect(item, key, passphrase, cb);
    }, function(err){
      if(err) throw err;
    });
  };
};

var connect = function(setup, key, passphrase, cb) {
  var s = new Server(setup.host, setup.port || 22, setup.user || 'root', key, passphrase);
  s.on('ready', function() {
    console.log('Connection ready'.green);
    clone(s, setup, cb);
  });
};

var clone = function(s, setup, cb) {
  s.run('git clone ' + setup.repo + ' ' + setup.folder, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0 && code !== 128) {
        console.log('[%s] Cloning failed! (%d)'.red, setup.name, code);
        process.exit(code);
      } else {
        if(code == 128) {
          console.log('[%s] Repo exists, checkingout tag! (%d)'.yellow, setup.name, code);
        } else {
          console.log('[%s] Checkout successfully! (%d)'.green, setup.name, code);
        }
        checkout(s, setup, cb);
      }
    });
  });
};

var checkout = function(s, setup, cb) {
  s.run('cd ' + setup.folder + '; git checkout ' + setup.tag, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) {
        console.log('[%s] Checkout failed! (%d)'.red, setup.name, code);
        process.exit(code);
      }
      console.log('[%s] Checkout successfully! (%d)'.green, setup.name, code);
      s.end();
      cb();
    });
  });
};