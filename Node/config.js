var debug = require('debug')('medicar');
var path = require('path');

// Hard coded name from object store container used in this demonstration. Export it to make it available to other modules. 
module.exports.container = "HDScontainer";

module.exports.containerDestroy = false;

module.exports.tmp = 'tmp';
module.exports.HOSTNAME = 'HOSTNAME';
module.exports.group_id = 'group_id';

// on premise credentials. export them and make them available to other modules
module.exports.onpremHost = process.env.GATEWAYIP;
module.exports.onpremPort = process.env.GATEWAYPORT;

