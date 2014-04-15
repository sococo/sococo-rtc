///<reference path="../../types/jasmine/jasmine.d.ts"/>
///<reference path="../../types/angular/angular-mocks.d.ts"/>
///<reference path="../../public/app/sococo-rtc.d.ts"/>
///<reference path="../fixtures/MockPubSub.ts"/>
module SRTC.Test {
   describe('SRTC.LocalPeer', () => {
      it('should construct in isolation', () => {
         var localPeer = new SRTC.LocalPeerConnection({
            pubSub: new MockPubSub(),
            location:"testRoom",
            localId:"testPeerId",
            serverUrl:"localhost:8102",
            serverMount:"/faye"
         });
         expect(localPeer).toBeTruthy();
      });
   });
}


