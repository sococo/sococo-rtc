// Sococo.RTC - Basic event emitter
//
// Replace with your project's existing event emitter when needed.
module Sococo.RTC {

   // Expected interface for for event emitter objects
   export interface IEvents {
      on(name: any, callback?: Function, context?: any): any;
      off(name?: string, callback?: Function, context?: any): any;
      trigger(name: string, ...args): any;
   }

   // Keys utility from Underscore.js (required for event emitter impl)

   //     Underscore.js 1.4.3
   //     http://underscorejs.org
   //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
   //     Underscore may be freely distributed under the MIT license.
   var keys = function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (obj.hasOwnProperty(key)) keys[keys.length] = key;
      return keys;
   };

   // Event emitter implementation based on Backbone.Events.

   //     Backbone.js 0.9.10
   //     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
   //     Backbone may be freely distributed under the MIT license.
   //     For all details and documentation:
   //     http://backbonejs.org

   // Regular expression used to split event strings.
   var eventSplitter = /\s+/;

   // Implement fancy features of the Events API such as multiple event
   // names `"change blur"` and jQuery-style event maps `{change: action}`
   // in terms of the existing API.
   var eventsApi = function(obj, action, name, rest) {
      if (!name) return true;
      if (typeof name === 'object') {
         for (var key in name) {
            obj[action].apply(obj, [key, name[key]].concat(rest));
         }
      } else if (eventSplitter.test(name)) {
         var names = name.split(eventSplitter);
         for (var i = 0, l = names.length; i < l; i++) {
            obj[action].apply(obj, [names[i]].concat(rest));
         }
      } else {
         return true;
      }
   };

   // Optimized internal dispatch function for triggering events. Tries to
   // keep the usual cases speedy (most Backbone events have 3 arguments).
   var triggerEvents = function(events, args) {
      var ev, i = -1, l = events.length;
      switch (args.length) {
         case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx);
            return;
         case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0]);
            return;
         case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
            return;
         case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
            return;
         default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
      }
   };

   export class Events implements IEvents {
      private _events:any;

      // Bind one or more space separated events, or an events map,
      // to a `callback` function. Passing `"all"` will bind the callback to
      // all events fired.
      on(name: any, callback?: Function, context?: any) {
         if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
         this._events || (this._events = {});
         var list = this._events[name] || (this._events[name] = []);
         list.push({callback: callback, context: context, ctx: context || this});
         return this;
      }

      // Remove one or many callbacks. If `context` is null, removes all
      // callbacks with that function. If `callback` is null, removes all
      // callbacks for the event. If `name` is null, removes all bound
      // callbacks for all events.
      off(name?: string, callback?: Function, context?: any) {
         var list, ev, events, names, i, l, j, k;
         if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
         if (!name && !callback && !context) {
            this._events = {};
            return this;
         }

         names = name ? [name] : keys(this._events);
         for (i = 0, l = names.length; i < l; i++) {
            name = names[i];
            if (list = this._events[name]) {
               events = [];
               if (callback || context) {
                  for (j = 0, k = list.length; j < k; j++) {
                     ev = list[j];
                     if ((callback && callback !== ev.callback &&
                        callback !== ev.callback._callback) ||
                        (context && context !== ev.context)) {
                        events.push(ev);
                     }
                  }
               }
               this._events[name] = events;
            }
         }

         return this;
      }

      // Trigger one or many events, firing all bound callbacks. Callbacks are
      // passed the same arguments as `trigger` is, apart from the event name
      // (unless you're listening on `"all"`, which will cause your callback to
      // receive the true name of the event as the first argument).
      trigger(name: string, ...args){
         if (!this._events) return this;
         var args:any[] = [].slice.call(arguments, 1);
         if (!eventsApi(this, 'trigger', name, args)) return this;
         var events = this._events[name];
         var allEvents = this._events.all;
         if (events) triggerEvents(events, args);
         if (allEvents) triggerEvents(allEvents, arguments);
         return this;
      }

   }
}