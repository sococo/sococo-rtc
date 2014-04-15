///<reference path="../../public/app/sococo-rtc.d.ts"/>
module Sococo.RTC.Test {
   /**
    * Simple PubSub class using observer pattern exposed by Events class.
    */
   export class MockPubSub extends SRTC.Events implements SRTC.IPubSub {
      connect(url:string,done:(error?: any) => void) {}
      disconnect() {}

      subscribe(channel:string,process:(data:any) => void,done:(error?:any) => void) {
         this.on(channel,process);
         done();
      }
      unsubscribe(channel:string) {
         this.off(channel);
      }
      publish(channel:string,data:any) {
         this.trigger(channel,data);
      }
   }
}


