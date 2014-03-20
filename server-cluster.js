"use strict";
var cluster = require('cluster');
if(cluster.isMaster){
   // TODO: Configure based on heroku dynos?  Get CPU count?
   for(var i = 0; i < 4; i++){
      var worker = cluster.fork();
   }
}
else {
   require("./server");
}