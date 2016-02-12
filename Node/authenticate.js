

var request = require('request');
var async = require('async');
var url = require('url');

var defaults = {
  openstackIdentityTokensKeystone: "/v3/auth/tokens",
  openstackIdentityTokensNative: "/auth/v1.0"
};

var services = JSON.parse(process.env.VCAP_SERVICES);


var getTokensKeystone = exports.getTokens = exports.getTokensKeystone = function (options, callback) {
  //var uri = url.parse(options.host);
  var uri = "https://identity.open.softlayer.com";
  uri.pathname = defaults.openstackIdentityTokensKeystone;
  //var targetURL = url.format(uri);
  var targetURL = "https://identity.open.softlayer.com/v3/auth/tokens"
  request(
    {
      method: 'POST',
      uri: targetURL, 
      json: {"auth": options.auth},
      headers: {"Accept": "application/json"}
    },
    function (err, res, body) {
      var tokens = {};
      if (!err && res && res.statusCode && res.statusCode === 201) {
        var respBody = body;
        tokens.id = res.headers["x-subject-token"];
        tokens.expires = res.body.token.expires_at;
        async.detect(
          res.body.token.catalog,
          function (item, cb) {
            var doesMatch = (item.type === 'object-store') && (item.name === options.storageName);
            return cb(doesMatch);
          },
          function (matchingItem) {
              var region = null;
              var i = 0;
              var t = 0;
        	  while(region != services['Object-Storage'][0]['credentials'].region ){
                              if ( res.body.token.catalog[7].endpoints[i].region == services['Object-Storage'][0]['credentials'].region ) { region = res.body.token.catalog[7].endpoints[i].region; t = 0; }
        		      i = i+1;
        	  }
              tokens.storageUrl = res.body.token.catalog[7].endpoints[i-1].url;
              return callback(err, res, tokens);
          }
        );
      } else {
        if(!err) {
          err = new Error("request unsuccessful, statusCode: " + res.statusCode);
        }
        return callback(err, res, tokens);
      }
    }
  );
};