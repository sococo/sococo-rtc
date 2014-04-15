///<reference path="../../public/app/sococo-rtc.d.ts"/>
module SRTC.Test {
   /**
    * Simple PubSub class using observer pattern exposed by Events class.
    */
   export class MockPubSub extends SRTC.Events implements SRTC.IPubSub {
      public connected:boolean = false;
      public subscribedChannels:any = {};

      connect(url:string,done?:(error?: any) => void) {
         done && done();
         this.connected = true;
      }
      disconnect() {
         this.connected = false;
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
         done && done();
      }
      unsubscribe(channel:string) {
         this.off(channel);
         this.incrementChannel(channel,-1);
      }
      publish(channel:string,data:any) {
         this.trigger(channel,data);
      }
   }
}


