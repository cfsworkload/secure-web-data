#!/usr/bin/env node
console.log('node version: ' + process.version);
console.log('medicar says hello.  setenv DEBUG=medicar to get a lot more log.  If DEBUG=medicar the next line should read: medicar debugging on');
var debug = require('debug')('medicar');
debug('debugging on');

debug('ENV: ');
debug(process.env);

var http = require('http');
var app = require('../app');

var port = (process.env.VCAP_APP_PORT || 9443);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');

app.set('port', port);

// create sever with app object passed from app.js module
var server = http.createServer(app);

// make the application listen on port provided by VCAP env variable
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

server.on('error', onError);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
