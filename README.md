# Sococo.RTC

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

or to run in a clustered environment

> node server-cluster.js

## Developing

This project uses Typescript to add static type checking while developing code, and produces
optimized outputs to reduce page load times in the browser.   When making changes to the styles
or sources of this application you'll need to use grunt-js.

If you do not have Grunt installed you may install it with the following command:

> npm install -g grunt-cli

Once you have grunt installed you may build the application with the grunt command, or start an
automated build when files change by using the `watch` task:

> grunt

> grunt watch

