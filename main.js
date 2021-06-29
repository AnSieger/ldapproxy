//Source: https://github.com/swcho/ldap-proxy/blob/master/app.js

var assert = require('assert');
var ldap = require('ldapjs');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json').toString());

var server = ldap.createServer();
var client = ldap.createClient({
    url: config.server.url
});

server.bind("", function(req, res, next) {
    console.log("ldap proxyserver in function: server bind");
    var id = req.id.toString();
    var dn = req.dn.toString();
    var pw = req.credentials;
    client.bind(dn, pw, function(err) {
        console.log("ldap proxyserver try to bind on ldapserver");
        if (err) {
            console.log('client bind error: ' + err);
        } else {
            console.log('client bind successful');
        }
    });
    client.on('end', function() {
        process.exit();
    });
    client.on('error', function() {
        process.exit();
    });
    res.end();
});

server.search(config.searchbase, function(req, res, next) {
    console.log("ldap proxyserver in function: server search");
    //console.log(req);
    //console.log('type: ' + req.type);
    //console.log('json: ' + JSON.stringify(req.json, null, 2));

    var id = req.id.toString();
    var base = req.dn.toString();
    var filter = req.filter.toString();
    var scope = req.scope.toString();

    console.log('search id: ' + id);
    console.log('search base: ' + base);
    console.log('search filter: ' + filter);
    console.log('search scope: ' + scope);
    var opts = {
        filter: filter,
        scope: scope
    };

    client.search(base, opts, function(err, search) {
        console.log("ldap proxyserver try to search on ldapserver");
        assert.ifError(err);

        search.on('searchEntry', function(entry) {
            //console.log('entry: ' + JSON.stringify(entry.object, null, 2));
            //console.log(entry.object);
            //console.log(entry.dn);

            var obj = {
                dn: entry.dn.toString(),
                attributes: {}
            };
            entry.attributes.forEach(function (a) {
                obj.attributes[JSON.parse(a).type] = JSON.parse(a).vals;
                //console.log(JSON.parse(a));
            });
            entry.messageID = res.messageID;
            res.send(obj);
        });
        search.on('searchReference', function(referral) {
            console.log('referral: ' + referral.uris.join());
        });
        search.on('error', function(err) {
            console.error('error: ' + err.message);
            res.error(err);
        });
        search.on('end', function(result) {
            console.log('status: ' + result.status);
            res.end();
        });
    });
});

server.listen(389, function() {
    console.log('LDAP server listening at %s', server.url);
    client.bind(config.server.bindDN, config.server.bindPW, function(err) {
        if (err) {
            console.log('client bind error: ' + err);
        } else {
            console.log('client bind successful');
        }
    });
    client.on('end', function() {
        process.exit();
    });
    client.on('error', function() {
        process.exit();
    });
});