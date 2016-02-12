
var express = require('express');
var router = express.Router();
var osv2 = require('../routesapi/osv2');
var onprem = require('../routesapi/onprem');
var Busboy = require('busboy');
var debug = require('debug')('medicar');
var request = require('request');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hybrid Data Store' });
});

/* GET Object Storage page. */
router.get('/osv2.html', function(req, res) {
  res.render('osv2', { title: 'Object Storage' })
});

/* GET On Premise page. */
router.get('/onprem.html', function(req, res) {
  res.render('onprem', { title: 'On Premise' })
});

/* GET vol page. */
router.get('/vol.html', function(req, res) {
  res.render('vol', { title: 'Volume on Disk' })
});

// when a file is selected to upload to object store from the GUI a post request to /api/obj/public/form is created and handled here
router.post('/api/obj/public/form', postObjFromForm);


// when this function is called is parses the request headers through busboy and calls post from the /routesap/osv2.js module
function postObjFromForm(req, res, callback) {
  debug('post osv2 /form');
  var busboy = new Busboy({headers: req.headers, limits: {files: 1}});
  var finalFileName; // file name posted, overridden by a field
  busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
    debug('post /form field:' + val + ' unused fieldnameTruncated: ' + fieldnameTruncated + ' unused valTruncated: ' + valTruncated);
    if (val) {
      finalFileName = val; // override the file name
    }
  });
  busboy.on('finish', function () {
    debug('post /form complete to: ' + finalFileName);
  });
  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    debug('post /form file: ' + filename + ' unused encoding:' + encoding + ' unused mimetype: ' + mimetype);
    if (!finalFileName) {
      finalFileName = filename; // if the file name has not been overridden use this one
    }
   osv2.post(req, res, file, finalFileName, function() {
     debug('post finish /form: ' + finalFileName);
     res.redirect('/');
   });
 });
  req.pipe(busboy);
}

// when a file is selected to be deleted from the GUI a post request to /api/obj/public/delete is created and handled here
router.post('/api/obj/public/delete', deleteObjFromForm);

// call deleteFile in the /routesap/osv2.js module
function deleteObjFromForm(req, res, callback) {
    var fileName = req.body.file;
    console.log("Name: " + fileName);
    osv2.deleteFile(req, res, fileName, function(returnvalue) {
            console.log('post delete /form: ' + fileName);
            res.redirect('/');
	});	   
}

//on premise

// when a file is selected to upload to onprem from the GUI a post request to /api/onprem/public/form is created and handled here
router.post('/api/onprem/public/form', postOnPremFromFrom)

// parse request headers with busboy and call delete in /routesapi/onprem.js
function postOnPremFromFrom(req, res) {
    console.log('post onprem /form');
    var busboy = new Busboy({ headers: req.headers, limits: { files: 1 } });
    var finalFileName; // file name posted, overridden by a field
    busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
        debug('post /form field:' + val + ' unused fieldnameTruncated: ' + fieldnameTruncated + ' unused valTruncated: ' + valTruncated);
        if (val) {
            finalFileName = val; // override the file name
        }
    });
    busboy.on('finish', function () {
        debug('post /form complete to: ' + finalFileName);
    });
    // the file is the input stream coming from the file
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        debug('post /form file: ' + filename + ' unused encoding:' + encoding + ' unused mimetype: ' + mimetype);
        if (!finalFileName) {
            finalFileName = filename; // if the file name has not been overridden use this one
        }
        onprem.post(req, res, file, finalFileName, function (returnValue) {
            debug('post finish /form: ' + finalFileName);
            res.redirect('/');
        });
    });
    req.pipe(busboy);
}

// when a files is selected to be deleted from on prem on the GUI a post request to /api/onprem/public/delete is created and handled here
router.post('/api/onprem/public/delete', deleteOnPremFromForm);


// send request with file name to /routesapi/onprem.js module
function deleteOnPremFromForm(req, res, callback){

console.log('post onprem /form');

    var fileName = req.body.file;
    console.log("Name: " + fileName);
    onprem.delete(req, res, fileName, function (returnvalue) {
             console.log('post delete /form: ' + fileName);
             res.redirect('/');
        });
}

module.exports = router;

