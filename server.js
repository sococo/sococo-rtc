/*jslint node:true */
"use strict";
var path = require('path');
var express = require('express');
var server = express();
var faye = require('faye');
var bayeuxMount = "/meet";
var cluster = require('cluster');


//-----------------------------------------------------------------------------
// Unique Room URL generation
//-----------------------------------------------------------------------------

// This is not intended for production use, and is simply for demonstration purposes.
var channelCounterMax = 4096;
var channelCounter1 = 0;
var channelCounter2 = 0;
var Hashids = require('hashids');
var roomHasher = new Hashids('SALT' + Math.random() * 100, 0, 'abcdefghijklmnopqrstuvwxyz');

function getUniqueMeetUrl() {
   if(channelCounter1 === channelCounterMax){
      channelCounter1 = 0;
      channelCounter2++;
      if(channelCounter2 >= channelCounterMax){
         throw new Error("You've exhausted your _very_ considerable number of room counters.")
      }
   }
   channelCounter1++;
   var hash = roomHasher.encrypt([channelCounter1,channelCounter2]);
   return hash;
}

// Heroku will specify the port to listen on with the `process.env.PORT` variable.
var serverPort = process.env.PORT || 4202;

// gzip scripts/css when possible.
server.use(express.compress());

// Pretty print HTML outputs in development and debug configurations
if(process.env.NODE_ENV !== 'production'){
   server.locals.pretty = true;
}

// Error reporter
server.use(express.errorHandler({
   dumpExceptions: true,
   showStack: true
}));
// Production Settings
server.configure('production', function(){
   server.use(express.errorHandler());
});

//-----------------------------------------------------------------------------
// Express Routes
//-----------------------------------------------------------------------------
server.get('/', function(req,res){
   res.redirect('/m/' + getUniqueMeetUrl());
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

var hServer = server.listen(serverPort);
console.log((cluster.isMaster ? "" : "[Worker" + cluster.worker.id + "]") + " Initialized on port " + serverPort);

//-----------------------------------------------------------------------------
// Configure Faye PubSub for peer messaging
//-----------------------------------------------------------------------------
!cluster.isMaster && console.log("[Worker" + cluster.worker.id + "] Initializing Faye...");
var fayeConfig = {
   mount: bayeuxMount,
   timeout: 45
};

// Support Redis via a fully qualified connection URL via `REDIS_URL`
// environment variable.  Detect Heroku RedisToGo and RedisCloud add-ons.
if(process.env.REDIS_URL || process.env.REDISTOGO_URL || process.env.REDISCLOUD_URL){
   try{
      var url = require('url');
      var uri = url.parse(process.env.REDIS_URL || process.env.REDISTOGO_URL || process.env.REDISCLOUD_URL);
      var fayeRedis = require('faye-redis');
      var redisName = process.env.REDISTOGO_URL ? "RedisToGo" : process.env.REDIS_URL ? "Redis" : "RedisCloud";
      console.log(" -- using " + redisName + " adapter at (" + uri.hostname + ":" + uri.port + ")");
      fayeConfig.engine = {
         type: fayeRedis,
         host: uri.hostname,
         port: uri.port
      };

      // Authentication
      if(uri.auth){
         fayeConfig.engine.password = uri.auth.split(":")[1];
      }
   }
   catch(e){
      delete fayeConfig.engine;
      console.log("   FAILED: " + e);
   }
}

// Catch bad cluster configurations and exit the app.
//
// It's better to blow up on start than silently fail and leave you guessing.
if(!cluster.isMaster && typeof fayeConfig.engine === 'undefined'){
   console.log([
      "Cluster Configuration Error: Exiting",
      "Cannot properly function in cluster mode without a remote storage adapter.",
      "Recommend: Configure Redis or run in single process mode:\n   node server.js."
   ].join('\n'));
   process.exit(1);
}

// Initialize and attach faye to the express server.
var bayeux = new faye.NodeAdapter(fayeConfig);
bayeux.attach(hServer);
