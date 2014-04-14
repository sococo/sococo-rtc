/*globals module,process,require */
module.exports = function(config) {
   "use strict";

   // Determine the proper test runner to use
   var isWin = !!process.platform.match(/^win/);
   var usePhantom = (process && process.env) ? process.env.TEAMCITY_VERSION : false;
   var browser = usePhantom ? "PhantomJS" : (isWin? "IE" : "Chrome");

   config.set({
      basePath: '../',
      frameworks: ['jasmine'],
      files: [
         "public/js/adapter.js",
         "public/app/sococo-rtc.js",
         "https://ajax.googleapis.com/ajax/libs/angularjs/1.2.12/angular.min.js",
         "https://ajax.googleapis.com/ajax/libs/angularjs/1.2.12/angular-cookies.min.js",
         "public/app/sococo-rtc-app.js",
         "public/app/test/*.js"
      ],
      reporters: ['dots'],
      port: 9876,
      autoWatch: true,
      background:true,
      // - Chrome, ChromeCanary, Firefox, Opera, Safari (only Mac), PhantomJS, IE (only Windows)
      browsers: [browser],
      singleRun: false,
      reportSlowerThan: 500,
      plugins: [
         'karma-ie-launcher',
         'karma-chrome-launcher',
         'karma-phantomjs-launcher',
         'karma-jasmine'
      ]
   });
};
