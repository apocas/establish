var Connection = require('ssh2'),
  sys = require('sys'),
  events = require('events');

var Server = function(host, port, user, key, passphrase) {
  var self = this;
  this.c = new Connection();

  this.c.on('ready', function() {
    self.emit('ready');
  });

  this.c.connect({
    host: host,
    port: port,
    username: user,
    privateKey: require('fs').readFileSync(key),
    passphrase: passphrase
  });
};

sys.inherits(Server, events.EventEmitter);

Server.prototype.run = function(command, cb) {
  this.c.exec(command, function(err, stream) {
    if (err) throw err;
    cb(stream);
  });
};

Server.prototype.end = function() {
  this.c.end();
};

module.exports = Server;