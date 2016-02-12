require('./polyfill');
/**
 * Module dependencies.
 */


var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passportLocal = require('passport-local');
var busboy = require('connect-busboy');
var session = require('express-session');
var passport = require('passport');
var routes = require('./routes/index');
var login = require('./routes/login');
var osv2 = require('./routesapi/osv2').router;
var onprem = require('./routesapi/onprem');
var BasicStrategy = require('passport-http').BasicStrategy;
var sanitizeFilename = require('sanitize-filename');
var async = require('async');
var storage = require('./storage');
var authenticate = require('./authenticate');
var config = require('./config');
var sleep = require('sleep');
var app = express();
var debug = require('debug')('medicar');
var sessionAndPassport = true; // set to true if session and passport is required
var services = JSON.parse(process.env.VCAP_SERVICES); // parse environment variables from VCAP_SERVICES


var credentials = {
		  "auth": {
			    "passwordCredentials": {
			      "userId": services['Object-Storage'][0]['credentials'].userId ,
			      "password": services['Object-Storage'][0]['credentials'].password
			    },
			    "tenantId": services['Object-Storage'][0]['credentials'].projectId
			  },
			  "host": services['Object-Storage'][0]['credentials'].auth_url,
			  "storageName":['Object-Storage'][0].name
			}
		

function saneFilename(fileName) {
    var sane = sanitizeFilename(fileName, {replacement: '_'});
    return sane === fileName;
}

function hostnameFromReq(req) {
    if (req.headers.host === 'localhost:3000') {
        return String(req.protocol) + "://" + req.headers.host;
    } else {
        return 'http://' + req.headers.host;
    }
}


//configure Single Sign On to be used through a passport strategy
function ssoConfigure(ssoConfig, appPath, hostname, ibmSsoCallbackPath) {
    var client_id = ssoConfig.credentials.clientId;
    var client_secret = ssoConfig.credentials.secret;
    var authorization_url = ssoConfig.credentials.authorizationEndpointUrl;
    var token_url = ssoConfig.credentials.tokenEndpointUrl;
    var issuer_id = ssoConfig.credentials.issuerIdentifier;
    var callback_url = hostname + ibmSsoCallbackPath;
    console.log('sso callback_url: ' + callback_url);

    var OpenIDConnectStrategy = require('./lib/passport-idaas-openidconnect').IDaaSOIDCStrategy;
    var ssoStrategy = new OpenIDConnectStrategy({
            authorizationURL: authorization_url,
            tokenURL: token_url,
            clientID: client_id,
            scope: 'openid',
            response_type: 'code',
            clientSecret: client_secret,
            callbackURL: callback_url,
            skipUserProfile: true,
            issuer: issuer_id
        },
        function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
                profile.accessToken = accessToken;
                profile.refreshToken = refreshToken;
                var userId = "IBM_" + profile.id;             
                return done(null, {
                    id: userId
                });
            })
        });

    passport.use(ssoStrategy);

    // GET /auth/ibmssologin generated from this application
    app.get(appPath, passport.authenticate('openidconnect', {}), function (/*req, res*/) {
        // The request will be redirected to sso for authentication, so this
        // function will not be called. If this is reached generate error
        console.error('unexpected sso callback');
    });

    // GET /auth/sso/callback - called after ibm sso validation.
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get(ibmSsoCallbackPath,
        passport.authenticate('openidconnect', {failureRedirect: '/login'}), function (req, res) {
//	    console.log(req.session);
//            res.redirect(ssoPath);
	     res.redirect('/');
        });

    // user hit the DONT ALLOW button instead of Allow or Allow and Remember
    app.post(ibmSsoCallbackPath, function (req, res) {
	      res.redirect('/');
	});

	
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // these can be served without session

// for every secure request redirect to regular http request
app.use (function (req, res, next) {
        if (req.secure) {
                // request was via https
                res.redirect('http://' + req.headers.host + req.url);
        } else {
                // request was via http
		console.log("Request was not secure moving on");
                next();
        }
})

// function to check request to server is authenticated. If not, redirect to SSO
function ensureAuthenticated(req,res,next) {
		//If user isn't authenticated, redirect to login
		if (!req.isAuthenticated()) {
			res.redirect('/auth/ibmssologin');
			
		} else {
			//If authenticated, continue to next middleware 
			return next();
		}
}


app.use(busboy());

// special case routing. everything else handled by pustopLayerRoutes
app.use('/api/obj/public',  require('./routesapi/osv2').router);
app.use('/api/onprem/public', require('./routesapi/onprem').router);

// for all requests create session and configure with server
if(sessionAndPassport) {
    app.all('*', waitForContactThenPushSessionAndPassport);
} else {
    // send all remaining request to routes
    pushTopLayerRoutes();
}


function pushTopLayerRoutes() {


    // for all requestes that reach here check that request is authenticated and then pass to routes module
    app.use('/', ensureAuthenticated, routes);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // Top of the routing stack.  Anything that gets here will fail
    var errorProperty = (app.get('env') === 'development') ? function(err) {return err;} : function(){return {};};

    app.use(function (err, req, res /*, next */) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: errorProperty(err)
        });
    });
}

var hasBeenContacted = false;

function waitForContactThenPushSessionAndPassport(req, res, next) {
    if (hasBeenContacted) return next();
    var hostname = hostnameFromReq(req);
    console.log('hostname: ' + hostname);
    hasBeenContacted = true;
    var sesionParameters = {
        resave: 'false',
        saveUninitialized: 'false',
        secret: 'secretusedtosignthesessionidcookie'
    };

    app.use(session(sesionParameters));
    app.use(passport.initialize());
    app.use(passport.session());

    // Passport login configuration
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function (obj, done) {
        done(null, {id: obj});
    });
     
     // pull SSO credentials from Bluemix VCAP env variable and pass to passport
     var ssoConfig = services['SingleSignOn'][0];
     if (ssoConfig) {
        ssoConfigure(ssoConfig, '/auth/ibmssologin', hostname, '/auth/sso/callback');
     }

    // The /login page will post a login with ser credentials
    app.use('/login', login);
    app.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}));

    app.get('/logout', function(req, res){
        req.logout();
        req.session.destroy();
        res.redirect('/');
    });
 
    pushTopLayerRoutes();
    return next();
}

module.exports = app;
