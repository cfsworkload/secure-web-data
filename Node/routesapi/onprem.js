'use strict';
var debug = require('debug')('medicar');
var express = require('express');
var router = express.Router();
var http = require('http');
var config = require('../config');
var fs = require('fs');
var Grid = require('gridfs-stream');
var mongoose = require('mongoose');


// http POST requests to /api/onprem/public recieve file from GUI stream and foward the request to on prem mongo DB
module.exports.post = function(req, res, readStream, fileName, callback) {
       var conn = config.conn;
       Grid.mongo = mongoose.mongo;
       console.log(" OnPremHost = mongodb://" + config.onpremHost + ":" + config.onpremPort);
       var conn = mongoose.createConnection("mongodb://" + config.onpremHost + ":" + config.onpremPort);
       console.log("Post to on prem file = " + fileName);
        var list;
        conn.once('open', function () {
                var gfs = Grid(conn.db);
                var writeStream = gfs.createWriteStream({
                        filename: fileName
                });

                writeStream.on('error', function(err) {
                     writeResCallback(err, res);
                });
                writeStream.on('success', function() {
                     writeResCallback(false, res);
                });
		writeStream.on('finish', function() {
                     callback(res);
		});
                readStream.pipe(writeStream);
                
        });

};

// when a file is selected to be deleted through the GUI a http POST request to /api/onprem/public/delete is created and is handled here. 
// file name is passed in body of req and request to delete in onprem MongoDB is sent
module.exports.delete = function(req, res, fileName, callback){

       var gfs;
       Grid.mongo = mongoose.mongo;
       var conn = mongoose.createConnection("mongodb://" + config.onpremHost + ":" + config.onpremPort);
       conn.once('open', function () {
             var gfs = Grid(conn.db);
             gfs.remove({ filename: fileName }, function (err) {
                if (err) return handleError(err);
                callback(res);
             });

       });
}

// when a http GET request is sent to /api/obj/public it is handled here and a JSON object is returned with all current items on onprem listed
router.get('/', function (req, res) {
       var GridFs = require('grid-fs');
       var gridFs;
       var writeStream;
       Grid.mongo = mongoose.mongo;
       var conn = mongoose.createConnection("mongodb://" + config.onpremHost + ":" + config.onpremPort);
       var strJson = "[";
        conn.once('open', function () {
                gridFs = new GridFs(conn.db);
                gridFs.list(function(err, list){
                        if(err){
                                console.log(err);
                        }else{
                                list.forEach(function(filename){
                                strJson += '{"name":"' + filename + '"}'
                                strJson += ',';
                                });
                        strJson = strJson.substring(0, strJson.length - 1);
                        strJson += ']';
                        res.write(strJson);
                        res.end();
                        }
                });


        });

});

// when a file is click on in the GUI a http POST request is created to /api/onprem/public/:filename and that is handled here. A request to retrieve file from 
// the onprem MongoDB is sent and returned to the response
router.get('/:file', function (req, res) {

    var fileName = req.params.file;
    debug('get onprem /' + fileName);
    Grid.mongo = mongoose.mongo;
    var conn = mongoose.createConnection("mongodb://" + config.onpremHost + ":" + config.onpremPort);

    conn.once('open', function () {
                var gfs = Grid(conn.db);
                console.log("database it open");
                gfs.createReadStream({filename: fileName}).pipe(res);

     });


});

module.exports.router = router;
