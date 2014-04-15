# Sococo.RTC [![Build Status](https://travis-ci.org/sococo/sococo-rtc.svg?branch=master)](https://travis-ci.org/sococo/sococo-rtc)

A simple prototype demonstrating how to build a dynamic WebRTC meeting application using
Typescript, Angular.JS, and Heroku.

> The main purpose of this application is demonstrate how to build a WebRTC application
> that allows for dynamic stream property changes in a cross-browser way.

## When should I care about this?

 * When you do not have an existing signaling server
 * When you do not want to worry about scaling your server at the last moment
 * When you're curious about how to deal with Signal Glare
 * When you would like to use PubSub as a stateless signaling solution

## Building and running

To build and run the project you'll need Node.JS with NPM installed on your system.  Once
you have node installed, simply install the application dependencies from the command line:

> npm install

Once the dependencies have been installed you can run the server:

> node server.js

If you wish to run the server in a node cluster, you will need to have support for some
kind of Redis database, which is used by Faye to share information about connections.

> node server-cluster.js

If you are deploying to heroku and using RedisToGo or RedisCloud, you need to do nothing
other than add them on your application.  If you're using a custom setup, make sure you
set an environment variable `REDIS_URL` to define the Redis connection URL.



## Developing

This project uses Typescript to add static type checking while developing code, and produces
optimized outputs to reduce page load times in the browser.   When making changes to the styles
or sources of this application you'll need to use grunt-js.

If you do not have Grunt installed you may install it with the following command:

> npm install -g grunt-cli

Once you have grunt installed you may build the application with the grunt command, or start an
automated build when files change by using the `develop` task, which will build the source files,
start a watch server, and run the express application:

> grunt develop

## Contributing Back

Follow the [git commit conventions](https://github.com/sococo/sococo-rtc/blob/master/CONVENTIONS.md), and submit
a pull request.
