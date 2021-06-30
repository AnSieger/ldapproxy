//Source: https://github.com/swcho/ldap-proxy/blob/master/app.js

var assert = require('assert');
var ldap = require('ldapjs');
var fs = require('fs');

//var config = JSON.parse(fs.readFileSync('config.json').toString());
//process.env.SERVER
//process.env.SEARCH_BASE

var server = ldap.createServer();
var client = ldap.createClient({
    url: process.env.SERVER
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
            return next(new ldap.InsufficientAccessRightsError());
        } else {
            console.log('client bind successful');
            res.end();
        }
    });
    client.on('end', function() {
        process.exit();
    });
    client.on('error', function() {
        process.exit();
    });
});

server.search(process.env.SEARCH_BASE, function(req, res, next) {
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
        scope: scope,
        paged: true
    };

    var posixaccount = filter.toLowerCase().includes("posixaccount");
    var posixgroup = filter.toLowerCase().includes("posixgroup");
    var groupOfUniqueNames = filter.toLowerCase().includes("groupofuniquenames");
    console.log("searching poxixaccount:" + posixaccount);
    console.log("searching posixgroup:" + posixgroup);
    console.log("searching groupOfUniqueNames:" + groupOfUniqueNames);

    client.search(base, opts, function(err, search) {
        console.log("ldap proxyserver try to search on ldapserver");
        assert.ifError(err);

        search.on('searchEntry', function(entry) {
            var obj = {
                dn: entry.dn.toString(),
                attributes: {}
            };
            entry.attributes.forEach(function (a) {
                obj.attributes[JSON.parse(a).type] = JSON.parse(a).vals;
            });

            if(posixaccount){addobjectclassattribute(obj,"posixaccount");}
            if(posixgroup){addobjectclassattribute(obj,"posixgroup");}
            if(groupOfUniqueNames){addobjectclassattribute(obj,"groupOfUniqueNames");}
            

            entry.messageID = res.messageID;
            res.send(obj);
        });
        search.on('searchReference', function(referral) {
            console.log('referral: ' + referral.uris.join());
        });
        search.on('error', function(err) {
            console.error('error: ' + err.message);
        });
        search.on('end', function(result) {
            console.log('status: ' + result.status);
            res.end();
        });
    });
});

server.listen(389, function() {
    console.log('LDAP server listening at %s', server.url);
});

function addobjectclassattribute(obj,objectclassname){
    if(obj.attributes.hasOwnProperty("objectClass")){
        console.log("Result has an objectClass");
        //Check if posixGroup attribute exist
        if(-1 < obj.attributes.objectClass.findIndex(item => objectclassname.toLowerCase() === item.toLowerCase())){
            console.log("Result has an " + objectclassname + " attribute. Nothing to do");
        }else{
            console.log("add " + objectclassname + " attribute");
            obj.attributes.objectClass.push(objectclassname);
        }
    }else{
        console.log("add objectclass with " + objectclassname + " attribute");
        obj.attributes["objectClass"] = [objectclassname];
    }
    return obj;
}

/*
            if(posixaccount){
                if(obj.attributes.hasOwnProperty("objectClass")){
                    console.log("Result has an objectClass");
                    //Check if Posixaccount attribute exist
                    if(-1 < obj.attributes.objectClass.findIndex(item => "posixaccount" === item.toLowerCase())){
                        console.log("Result has an posixAccount attribute. Nothing to do");
                    }else{
                        obj.attributes.objectClass.push('posixAccount');
                    }
                }else{
                    onsole.log("add objectclass with posixAccount attribute");
                    obj.attributes["objectClass"] = ['posixAccount'];
                }
            }
            
            if(posixgroup){
                if(obj.attributes.hasOwnProperty("objectClass")){
                    console.log("Result has an objectClass");
                    //Check if posixGroup attribute exist
                    if(-1 < obj.attributes.objectClass.findIndex(item => "posixgroup" === item.toLowerCase())){
                        console.log("Result has an posixgroup attribute. Nothing to do");
                    }else{
                        obj.attributes.objectClass.push('posixgroup');
                    }
                }else{
                    console.log("add objectclass with posixgroup attribute");
                    obj.attributes["objectClass"] = ['posixgroup'];
                }
            }
*/