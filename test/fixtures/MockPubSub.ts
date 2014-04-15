///<reference path="../../public/app/sococo-rtc.d.ts"/>
module SRTC.Test {
   /**
    * Simple PubSub class using observer pattern exposed by Events class.
    */
   export class MockPubSub extends SRTC.Events implements SRTC.IPubSub {
      public connected:boolean = false;
      public subscribedChannels:any = {};

      defer(fn:any) {
         if(!fn){
            return;
         }
         setTimeout(() => {
            fn();
         });
      }

      connect(url:string,done?:(error?: any) => void) {
         this.connected = true;
         done && this.defer(done);
      }
      disconnect() {
         this.connected = false;
         this.off();
      }

      incrementChannel(channel:string,val:number){
         if(typeof this.subscribedChannels[channel] === 'undefined'){
            this.subscribedChannels[channel] = 0;
         }
         this.subscribedChannels[channel] += val;
      }

      subscribe(channel:string,process:(data:any) => void,done?:(error?:any) => void) {
         this.on(channel,process);
         this.incrementChannel(channel,1);
         done && this.defer(done);
      }
      unsubscribe(channel:string) {
         this.off(channel);
         this.incrementChannel(channel,-1);
      }
      publish(channel:string,data:any) {
         this.defer(() => {
            this.trigger(channel,data);
         });
      }
   }
}


