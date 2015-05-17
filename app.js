/**
 * Created by Joao on 16/05/2015.
 */
var WebSocketClient = require('websocket').client;
var express    = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var auth = require('basic-auth');


var client = new WebSocketClient();
var app = new express();

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));


// Express init
app.use(bodyParser.json());

function isAdminUser(req, res, next) {
    var user = auth(req);

    if (user === undefined || user['name'] !== config.adminuser || user['pass'] !== config.adminpass ) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="GCM Server"');
        res.end('Unauthorized');
    } else {
        next();
    }
}

// MongoDB Init
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/pushdb');

console.log("Connected to MongoDB");
var alltokens = db.get('registertokens');

alltokens.find({},{},function(err,docs){
    console.log("Number of entries:" + docs.length);
});

// WebSocket Client
client.on('connectFailed', function(error) {
    console.log('Websocket Connect: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });

    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

// REST Register Service
app.post('/register', function(sReq, sRes){
    var count = sReq.body.length;
    var collection = db.get('registertokens');
    if(!count){
        var query = { "username" : sReq.body.username };
        console.log("Query...");
        collection.find(query,{},function(err,docs){
            if(docs.length === 0){ //Insert
                console.log("Inseriu...");
                collection.insert(sReq.body);
            }
        });
    }
    else{
        for(var i = 0; i < sReq.body.length; i++){
            var query = { "username" : sReq.body[i].username };
            collection.find(query,{},function(err,docs){
                if(docs.length === 0){ //Insert
                    collection.insert(sReq.body[i]);
                }
            });
        }
    }
    sRes.send("Ok");
    console.log(JSON.stringify(sReq.body));
});

// REST Add User Service
app.post('/adduser', isAdminUser, function(sReq, sRes){
    if(!sReq.body.user || !sReq.body.email){
        sReq.statusCode = "400";
        sReq.res.end('User or email missing');
    }
    else{
        var collection = db.get('mobileusers');
        var query = { "username" : sReq.body.user };
        collection.find(query,{},function(err,docs){
            if(docs.length !== 0){
                sReq.statusCode = "400";
                sReq.res.end('User already exists');
            }
            else{
                var newuser = { "user" : sReq.body.user, "email" : sReq.body.email };
                collection.insert(newuser);
                sReq.send("Ok");
            }
        });
    }
});

// Websockets
var websockhost = 'ws://' + config.wsserver + '/';
client.connect(websockhost, 'echo-protocol');
console.log('Connecting to websocket at ' + websockhost);

// REST server
app.listen(config.restport);
console.log('REST Server Listening on port 9090...');