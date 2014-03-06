/*global module*/
module.exports = function(grunt) {
   "use strict";
   var config = {
      pkg: grunt.file.readJSON('package.json'),

      /**
       * Compile TypeScript app
       */
      typescript: {
         options: {
            module: 'commonjs', //or commonjs
            target: 'es3', //or es3
            sourcemap: true,
            declaration: true,
            comments:true,
            base_path: "source/"
         },
         app: {
            src: [
               "source/Events.ts",
               "source/MeshPeerManager.ts",
               "source/PeerConnection.ts"
            ],
            dest: 'public/app/sococo-rtc.js'
         }
      },
      concat: {
         styles:{
            src: [
               "public/css/bootstrap.css",
               "public/index.css",
               "public/fonts/sococortc.css"
            ],
            dest: 'public/app/sococo-rtc.css'
         }
      },
      uglify: {
         app: {
            options: {
               sourceMap: true,
               sourceMapName: 'public/app/sococo-rtc.min.js.map'
            },
            files: {
               'public/app/sococo-rtc.min.js': ['public/app/sococo-rtc.js']
            }
         }
      },
      cssmin: {
         css:{
            files: {
               'public/app/sococo-rtc.min.css': ['public/app/sococo-rtc.css']
            }
         }
      }
   };


   grunt.initConfig(config);
   grunt.loadNpmTasks('grunt-typescript');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-cssmin');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.registerTask('default', ['typescript','concat','uglify','cssmin']);
};
