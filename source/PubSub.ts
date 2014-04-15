/*!
 * Sococo.RTC (http://github.com/sococo/sococo-rtc/)
 * Copyright 2014 Social Communications Company
 * Licensed under MIT (https://github.com/sococo/sococo-rtc/blob/master/LICENSE)
 */

module SRTC {
   declare var Faye:any;
   declare var require:any;

   export interface IPubSub {
      connect:(url:string,done:(error?: any) => void) => any;
      disconnect:() => any;
      subscribe:(channel:string,process:(data:any) => void,done:(error?:any) => void) => any;
      unsubscribe:(channel:string) => any;
      publish:(channel:string,data:any) => any;
   }

   export class FayePubSub implements IPubSub {
      private _faye:any = null;
      private _connected:boolean = false;
      private _assertValidConnection(){
         if(!this._faye || !this._connected){
            throw new Error("Must have a valid Faye connection before subscribing to a channel");
         }
      }
      connect(url:string,done:(error?: any) => void) {
         if(typeof Faye === 'undefined'){
            Faye = require('faye');
         }
         this._faye = new Faye.Client(url);
         this._faye.connect(() => {
            this._connected = true;
            done();
         });
      }
      disconnect() {
         if(this._faye){
            this._faye.disconnect();
         }
         this._connected = false;
      }
      subscribe(channel:string,process:(data:any) => void,done:(error?:any) => void) {
         this._assertValidConnection();
         var sub = this._faye.subscribe(channel,process);
         sub.callback(() => {
            done();
         });
         sub.errback(() => {
            done("Failed to subscribe to channel: " + channel);
         });
      }
      unsubscribe(channel:string) {
         this._assertValidConnection();
         this._faye.unsubscribe(channel);
      }
      publish(channel:string,data:any) {
         this._assertValidConnection();
         this._faye.publish(channel,data);
      }
   }
}