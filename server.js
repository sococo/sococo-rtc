/*jslint node:true */
"use strict";
var path = require('path');
var express = require('express');
var server = express();
var faye = require('faye');
var bayeux = new faye.NodeAdapter({
   mount:    '/meet',
   timeout:  45
});
var env = server.get('env');

// Heroku will specify the port to listen on with the `process.env.PORT` variable.
var serverPort = process.env.PORT || 4202;

// gzip scripts/css when possible.
server.use(express.compress());

// Pretty print HTML outputs in development and debug configurations
if(env !== 'production'){
   server.locals.pretty = true;
}

// Development Settings
server.configure(function(){
   server.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
   }));
});
// Production Settings
server.configure('production', function(){
   server.use(express.errorHandler());
});


// Mount the `public` directory for static file serving.
server.use(express.static(path.resolve(__dirname + "/public")));

server.use("/source", express.static(path.resolve(__dirname + "/source")));

// Set up faye realtime connections
var hServer = server.listen(serverPort);
bayeux.attach(hServer);
console.log("Server running on port " + serverPort);