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
         lib: {
            src: [
               "source/Events.ts",
               "source/LocalPeer.ts",
               "source/PeerConnection.ts"
            ],
            dest: 'public/app/sococo-rtc.js'
         },
         app: {
            src: [
               "source/app/*.ts"
            ],
            dest: 'public/app/sococo-rtc-app.js'
         }
      },
      concat: {
         styles:{
            src: [
               "public/css/bootstrap.css",
               "public/css/animate.css",
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
               sourceMapName: 'public/app/app.js.map'
            },
            files: {
               'public/app/app.js': [
                  'public/app/sococo-rtc.js',
                  'public/app/sococo-rtc-app.js'
               ]
            }
         }
      },
      cssmin: {
         css:{
            files: {
               'public/app/sococo-rtc.min.css': ['public/app/sococo-rtc.css']
            }
         }
      },


      // Watch for changes and trigger associated tasks.
      watch: {
         lib: {
            files: ['source/*.ts'],
            tasks: ['typescript:lib']
         },
         app: {
            files: ['source/app/*.ts'],
            tasks: ['typescript:app']
         },
         styles: {
            files: ['<%= concat.styles.src %>'],
            tasks: ['concat','cssmin']
         },
         server: {
            files:  [ "server*.js" ],
            tasks:  [ 'express:server' ],
            options: {
               nospawn: true // Without this option specified express won't be reloaded
            }
         }
      },


      /**
       * Manage running and restarting the server process.
       */
      express: {
         server: {
            options: {
               script: 'server.js',
               port: 4202
            }
         }
      }
   };

   grunt.initConfig(config);
   grunt.loadNpmTasks('grunt-typescript');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-cssmin');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-express-server');
   grunt.registerTask('default', ['typescript','concat','uglify','cssmin']);
   grunt.registerTask('develop', ['default','express','watch']);
};
