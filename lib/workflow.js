require('colors');

var writeStream = require('fs').createWriteStream,
  pack = require('tar-pack').pack,
  os = require('os'),
  path = require('path'),
  debug = require('debug')('network');


exports.clone = function(s, setup, cb) {
  console.log('[%s] Clone starting.'.green, setup.name);
  var cmd = 'git clone ' + setup.repo + ' ' + setup.destination;

  debug('running: ' + cmd);

  s.run(cmd, function(stream) {
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
          console.log('[%s] Cloned successfully! (%d)'.green, setup.name, code);
        }
      }
      cb();
    });
  });
};


exports.checkout = function(s, setup, cb) {
  console.log('[%s] Checkout starting.'.green, setup.name);
  var tag = setup.tag || 'master';
  var cmd = 'cd ' + setup.destination + '; git checkout ' + tag;

  debug('running: ' + cmd);

  s.run(cmd, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) throw new Error('[' + setup.name + '] Checkout failed! (' + code + ')');
      console.log('[%s] Checkout %s successfully! (%d)'.green, setup.name, tag, code);
      cb();
    });
  });
};


exports.install = function(s, setup, cb) {
  console.log('[%s] Npm Install starting.'.green, setup.name);
  var cmd = 'cd ' + setup.destination + '; npm install';

  debug('running: ' + cmd);

  s.run(cmd, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) throw new Error('[' + setup.name + '] Npm install failed! (' + code + ')');
      console.log('[%s] Npm install successfully! (%d)'.green, setup.name, code);
      cb();
    });
  });
};


exports.execute = function(s, setup, cb) {
  console.log('[%s] Starting execution.'.green, setup.name);
  
  var start = 'npm start;';
  if(setup.runscript) start = 'npm run ' + setup.runscript + ';';
  if(setup.npmscript) start = 'npm run ' + setup.npmscript + ';';
  var cmd = processEnv(setup) + 'cd ' + setup.destination + ';' + start;

  debug('running: ' + cmd);
  
  s.run(cmd, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) throw new Error('[' + setup.name + '] Execute failed! (' + code + ')');
      console.log('[%s] Started successfully! (%d)'.green, setup.name, code);
      cb();
    });
  });
};


exports.restart = function(s, setup, cb) {
  console.log('[%s] Restarting.'.green, setup.name);
  
  var restart = 'npm restart;';
  if(setup.restartscript) restart = 'npm run ' + setup.restartscript + ';';
  var cmd = processEnv(setup) + 'cd ' + setup.destination + ';' + restart;

  debug('running: ' + cmd);
  
  s.run(cmd, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) throw new Error('[' + setup.name + '] Restart failed! (' + code + ')');
      console.log('[%s] Restarted successfully! (%d)'.green, setup.name, code);
      cb();
    });
  });
};


exports.stop = function(s, setup, cb) {
  console.log('[%s] Stopping.'.green, setup.name);
  
  var stop = 'npm stop;';
  if(setup.restartscript) stop = 'npm run ' + setup.restartscript + ';';
  var cmd = processEnv(setup) + 'cd ' + setup.destination + ';' + stop;

  debug('running: ' + cmd);
  
  s.run(cmd, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) throw new Error('[' + setup.name + '] Stop failed! (' + code + ')');
      console.log('[%s] Stopped successfully! (%d)'.green, setup.name, code);
      cb();
    });
  });
};


exports.compress = function(s, setup, cb) {
  console.log('[%s] Building tarball.'.green, setup.name);

  var destPath = path.join(os.tmpdir(), setup.name + '.tar.gz');

  //console.log(destPath);

  pack(setup.folder)
    .pipe(writeStream(destPath))
    .on('error', function (err) {
      throw err;
    })
    .on('close', function () {
      console.log('[%s] Tarball built.'.green, setup.name);
      cb();
    });
};



exports.backup = function(s, setup, cb) {
  console.log('[%s] Backup starting.'.green, setup.name);

  var backupsPath = setup.destination + '/../.' + setup.name + '_backups/';
  var mkdi = 'mkdir -p ' + backupsPath;
  var cmd = 'cp -R ' + setup.destination + ' ' + backupsPath + '/' + setup.name + '_';

  debug('running: ' + cmd);

  s.run(cmd, function(stream) {
    stream.on('data', function(data, extended) {
      debug('[' + setup.name + '] ' + (extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
    });

    stream.on('exit', function(code, signal) {
      if(code !== 0) throw new Error('[' + setup.name + '] Backup failed! (' + code + ')');
      console.log('[%s] Backup ended %s successfully! (%d)'.green, setup.name, tag, code);
      cb();
    });
  });
};


var processEnv = function(setup) {
  var output = '';
  if(setup.env) {
    var keys = Object.keys(setup.env);
    for (var i = keys.length - 1; i >= 0; i--) {
      output += 'export ' + keys[i] + '=' + setup.env[keys[i]] + '; ';
    }
  }
  return output;
};