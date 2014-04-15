///<reference path="../../types/jasmine/jasmine.d.ts"/>
///<reference path="../../types/angular/angular-mocks.d.ts"/>
///<reference path="../../public/app/sococo-rtc.d.ts"/>
///<reference path="../fixtures/MockPubSub.ts"/>

module Sococo.RTC.Test {
   describe('SRTC.PeerConnection', () => {
      beforeEach(() => {

      });
      it('should construct in isolation', () => {
         var config:SRTC.PeerConnectionConfig = {
            pipe: new MockPubSub(),
            zoneId: "testZone",
            localId: "localUserId",
            remoteId: "remoteUserId"
         };
         var peerProperties:SRTC.PeerProperties = {
            sendAudio:false,
            sendVideo:false,
            receiveAudio:false,
            receiveVideo:false
         };
         var remotePeerNegotiator = new SRTC.PeerConnection(config,peerProperties);
         expect(remotePeerNegotiator).toBeTruthy();
      });
   });
}


