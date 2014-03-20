"use strict";
var cluster = require('cluster');
if(cluster.isMaster){
   var workerCount = process.env.WORKER_COUNT || require('os').cpus().length;
   var workers = new Array(workerCount);
   for(var i = 0; i < workerCount; i++){
      !function spawn(i) {
         workers[i] = cluster.fork();
         workers[i].on('exit', function() {
            console.error('sococo-rtc: worker died, respawning');
            spawn(i);
         });
      }(i);
   }
}
else {
   require("./server");
}