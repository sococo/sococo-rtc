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
            dest: 'public/app/<%= pkg.name %>.js'
         },
         app: {
            src: [
               "source/app/*.ts"
            ],
            dest: 'public/app/<%= pkg.name %>-app.js'
         },
         tests: {
            src: [
               "test/*.ts",
               "test/**/*.ts"
            ],
            dest: 'public/app/test/<%= pkg.name %>.test.js'
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
         },
         tests: {
            files: [
               '<%= typescript.tests.src %>'
            ],
            tasks: ['typescript:tests']
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
      },


      /**
       * Release/Deploy tasks
       */
      bump: {
         options: {
            files: ['package.json', 'bower.json'],
            updateConfigs: ['pkg'],
            commit: true,
            commitMessage: 'chore(deploy): release v%VERSION%',
            commitFiles: ['package.json', 'bower.json', 'CHANGELOG.md'],
            createTag: true,
            tagName: 'v%VERSION%',
            tagMessage: 'Version %VERSION%',
            push: true,
            pushTo: 'origin',
            gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
         }
      },
      changelog: {},

      'npm-contributors': {
         options: {
            commitMessage: 'chore(attribution): update contributors'
         }
      }
   };

   grunt.initConfig(config);

   // Build tasks
   grunt.loadNpmTasks('grunt-typescript');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-cssmin');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.registerTask('default', ['typescript','concat','uglify','cssmin']);

   // Develop/debug
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-express-server');
   grunt.registerTask('develop', ['default','express','watch']);

   // Release/Deploy
   grunt.loadNpmTasks('grunt-bump');
   grunt.loadNpmTasks('grunt-conventional-changelog');
   grunt.loadNpmTasks('grunt-npm');
   grunt.registerTask('release', 'Build, bump and tag a new release.', function(type) {
      type = type || 'patch';
      grunt.task.run([
         'npm-contributors',
         "bump:" + type + ":bump-only",
         'changelog',
         'bump-commit'
      ]);
   });

};
