'use strict';
var debug = require('debug')('medicar');
var express = require('express');
var config = require('../config');
var async = require('async');
var storage = require('../storage');
var authenticate = require('../authenticate');

//var services = JSON.parse(process.env.VCAP_SERVICES);
var services = JSON.parse(process.env.VCAP_SERVICES);

var credentials = { "auth": { "identity": { "methods": [ "password" ], "password": { "user": { "id": services['Object-Storage'][0]['credentials'].userId, "password": services['Object-Storage'][0]['credentials'].password } } }, "scope": { "project": { "id": services['Object-Storage'][0]['credentials'].projectId} } } }

var authFn = async.apply(authenticate.getTokensKeystone, credentials); 
var router = express.Router();

// read the req into the fileName within the osv2 client and send appropriate res
function readRequestIntoOsv2(req, res, containerName, fileName, inputStream, writeResCallback) {

        var storageSwift = new storage.OpenStackStorage (authFn,  function(err, response, tokens){
                storageSwift.createContainer(config.container, function (err, statusCode) { if(err) { console.log(err); console.log(statusCode); }
                // put api call to upload file to Osv2 in write stream
                	storageSwift.putFile(containerName, {remoteName: fileName, stream: inputStream}, function(err){
                           if(err) console.log(err);
                           else {
                                writeResCallback(false, res);
                            }
                 	});
                });
        });
}

// for every POST http request to /api/obj/public Write a file from a stream provided by the GUI. 
module.exports.post = function(req, res, readStream, fileName, callback) {
        console.log('post obj from gui /' + fileName);
        readRequestIntoOsv2(req, res, config.container, fileName, readStream, function(err, res) {
            if (err) {
                res.status(404).json(err).end();
            } else {
                callback && callback(res);
            }
        });

};


// for every GET http request to /api/obj/public return json list of current hosted files
router.get('/', function (req, res) {
                var storageSwift = new storage.OpenStackStorage (authFn,  function(err, response, tokens){
                                storageSwift.createContainer(config.container, function (err, statusCode) { if(err) { console.log(err); console.log(statusCode); }
                                                storageSwift.getFiles(config.container, function(err,files){
                                                        if(err){
                                                                        res.json(err).end();
                                                                }
                                                		else{	
                                                          res.json(files).end();
                                                            }
                                                		return;
                                                });
                                 });
                 });
});



// when ever a file is select in the GUI a get request is created to /api/obj/public/:filename and is handled here. The file is grabbed from object is grabbed 
// object store and set to the response
router.get('/:file', function (req, res) {
    // todo return res.status(200).end();
    var fileName = req.params.file;
    var storageSwift = new storage.OpenStackStorage (authFn, function(err, response, tokens) {
          storageSwift.createContainer(config.container, function (err, statusCode) { if(err) { console.log(err); console.log(statusCode); }
             storageSwift.getFile(config.container, { remoteName: fileName, stream: res}, function ( err ){
                 if(err) console.log(err);
                 else {
                                                res.end();
                 }
             })
         });
    });
});



// when a file is selected to be deleted on the GUI a post request to /api/obj/public/delete with the filename in the body of the request. This is handled here
// and a request to delete the file on object store is sent
module.exports.deleteFile = function(req, res, fileName, callback){
         var storageSwift = new storage.OpenStackStorage (authFn, function(err, response, tokens) {
             storageSwift.createContainer(config.container, function (err, statusCode) { if(err) { console.log(err); console.log(statusCode); }
             	storageSwift.deleteFile(config.container, fileName, function (err, statusCode) {
                 	if(err) console.log(err); else callback(res);
             	});
           	});
         });
}


module.exports.router = router;
