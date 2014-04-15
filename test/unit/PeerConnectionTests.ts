///<reference path="../../types/jasmine/jasmine.d.ts"/>
///<reference path="../../types/angular/angular-mocks.d.ts"/>
///<reference path="../../public/app/sococo-rtc.d.ts"/>
///<reference path="../fixtures/MockPubSub.ts"/>

module SRTC.Test {
   describe('SRTC.PeerConnection', () => {
      var pipe:MockPubSub;
      var config:SRTC.PeerConnectionConfig;
      var peerProperties:SRTC.PeerProperties = {
         sendAudio:false,
         sendVideo:false,
         receiveAudio:false,
         receiveVideo:false
      };
      beforeEach(() => {
         pipe = new MockPubSub();
         config = {
            pipe: <IPubSub>pipe,
            zoneId: "testZone",
            localId: "localUserId",
            remoteId: "remoteUserId"
         };
      });
      it('should throw error if given disconnected pub/sub', () => {
         var remote = () => {
            new SRTC.PeerConnection(config,peerProperties);
         };
         expect(remote).toThrow("PeerConnection requires a connected PubSub to function");
      });
   });
}


