/*jslint node:true */
"use strict";
var path = require('path');
var express = require('express');
var server = express();
var faye = require('faye');
var bayeuxMount = "/meet";
var env = server.get('env');


// This is used for simple unique short URL generation.
//
// It is not intended for production use, and is simply
// for demonstration purposes.
var channelIdCount = 0;
var Hashids = require('hashids');
var roomHasher = new Hashids('SUPER _ SECRET _ SERVER _ SALT', 0, 'abcdefghijklmnopqrstuvwxyz0123456789');

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


server.get('/', function(req,res){
   res.render('index.html',{
      pubsubport:serverPort,
      pubsubmount:bayeuxMount,
      channel:'demoRoom'
   });
});

server.get('/m/:id', function(req,res){
   res.render('index.html',{
      pubsubport:serverPort,
      pubsubmount:bayeuxMount,
      channel:req.params.id
   });
});

// Use EJS templating with Express, and assign .html as the default extension.
server.engine('.html', require('ejs').__express);
server.set('view engine', 'html');
server.set('views',"public/");


// Mount the `public` directory for static file serving.
server.use(express.static(path.resolve(__dirname + "/public")));

server.use("/source", express.static(path.resolve(__dirname + "/source")));

// Set up faye realtime connections
var bayeux = new faye.NodeAdapter({
   mount:    bayeuxMount,
   timeout:  45
});
var hServer = server.listen(serverPort);
bayeux.attach(hServer);
console.log("Server running on port " + serverPort);