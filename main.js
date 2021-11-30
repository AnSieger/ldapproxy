var assert = require('assert');
var ldap = require('ldapjs');
var fs = require('fs');
var CronJob = require('cron').CronJob;

printlog("ENV Varibale SERVER: " + process.env.SERVER);
printlog("ENV Varibale SEARCH_BASE: " + process.env.SEARCH_BASE);

var server = ldap.createServer();
var client = ldap.createClient({
    url: process.env.SERVER
});

var job = new CronJob({
    cronTime: '0 1 * * * *',
    onTick: function() {
      printlog("planned restart");
      server.ldap.createServer();
    },
    start: false,
    timeZone: 'America/Los_Angeles'
  });
  
  job.start();

server.bind("", function(req, res, next) {
    printlog("ldap proxyserver in function: server bind");
    var id = req.id.toString();
    var dn = req.dn.toString();
    var pw = req.credentials;
    client.bind(dn, pw, function(err) {
        printlog("ldap proxyserver try to bind on ldapserver");
        if (err) {
            printlog('client bind error: ' + err);
            return next(new ldap.InsufficientAccessRightsError());
        } else {
            printlog('client bind successful');
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
    printlog("ldap proxyserver in function: server search");
    var id = req.id.toString();
    var base = req.dn.toString();
    var filter = req.filter.toString();
    var scope = req.scope.toString();

    printlog('search id: ' + id);
    printlog('search base: ' + base);
    printlog('search filter: ' + filter);
    printlog('search scope: ' + scope); 
    var opts = {
        filter: filter,
        scope: scope,
        paged: true
    };

    var posixaccount = filter.toLowerCase().includes("posixaccount");
    var posixgroup = filter.toLowerCase().includes("posixgroup");
    var groupOfUniqueNames = filter.toLowerCase().includes("groupofuniquenames");
    printlog("request include poxixaccount: " + posixaccount);
    printlog("request include posixgroup: " + posixgroup);
    printlog("request include groupOfUniqueNames: " + groupOfUniqueNames);

    client.search(base, opts, function(err, search) {
        printlog("ldap proxyserver try to search on ldapserver");
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
            printlog('referral: ' + referral.uris.join());
        });
        search.on('error', function(err) {
            console.error('error: ' + err.message);
        });
        search.on('end', function(result) {
            printlog('status: ' + result.status);
            res.end();
        });
    });
});

server.listen(389, function() {
    printlog("LDAP server listening at " + server.url);
});

function addobjectclassattribute(obj,objectclassname){
    if(obj.attributes.hasOwnProperty("objectClass")){
        printlog("Result has an objectClass");
        //Check if posixGroup attribute exist
        if(-1 < obj.attributes.objectClass.findIndex(item => objectclassname.toLowerCase() === item.toLowerCase())){
            printlog("Result has an " + objectclassname + " attribute. Nothing to do");
        }else{
            printlog("add " + objectclassname + " attribute");
            obj.attributes.objectClass.push(objectclassname);
        }
    }else{
        printlog("add objectclass with " + objectclassname + " attribute");
        obj.attributes["objectClass"] = [objectclassname];
    }
    return obj;
}

function printlog(logtext){
    current_time = new Date();
    output_time_string =
        current_time.getDate()      +"."+
        current_time.getMonth()     +"."+
        current_time.getFullYear()  +" "+
        current_time.getHours()     +":"+
        current_time.getMinutes()   +":"+
        current_time.getSeconds();
    console.log(output_time_string + " -> " + logtext);
}