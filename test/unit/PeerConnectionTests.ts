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
      beforeEach((done) => {
         pipe = new MockPubSub();
         pipe.connect('null://fake',(error?:any) => {
            done();
         });
         config = {
            pipe: <IPubSub>pipe,
            zoneId: "testZone",
            localId: "localUserId",
            remoteId: "remoteUserId"
         };
      });
      afterEach(() => {
         pipe.disconnect();
      });
      it('should throw error if given disconnected pub/sub', () => {
         var conn = new SRTC.PeerConnection(config,peerProperties);
         pipe.disconnect();
         expect(()=>{ conn.connect(); }).toThrowError();
      });
      it('should subscribe to peer channel on construction', (done) => {
         var remote = new SRTC.PeerConnection(config,peerProperties);
         remote.connect();
         remote.on('ready',() => {
            expect(pipe.subscribedChannels[remote.getPeerChannel()]).toBe(1);
            remote.destroy();
            done();
         });
      });

      describe('Two Peers', () => {
         var local:SRTC.PeerConnection;
         var remote:SRTC.PeerConnection;
         beforeEach(() => {
            local = new SRTC.PeerConnection({
               pipe: <IPubSub>pipe,
               zoneId: "testZone",
               localId: "user1",
               remoteId: "user2"
            },peerProperties);
            remote = new SRTC.PeerConnection({
               pipe: <IPubSub>pipe,
               zoneId: "testZone",
               localId: "user2",
               remoteId: "user1"
            },peerProperties);
         });

         afterEach(() => {
            local.destroy();
            remote.destroy();
         });

         it('should generate deterministic channel name for peers to share', () => {
            expect(local.getPeerChannel()).toBe(remote.getPeerChannel());
         });

         it('should connect peers and signal ready', (done) => {
            var remaining:number = 2;
            var decrement = () => {
               remaining--;
               if(remaining <= 0){
                  done();
               }
            };
            local.on('ready',decrement);
            local.connect();
            remote.on('ready',decrement);
            remote.connect();
            expect(pipe.subscribedChannels[local.getPeerChannel()]).toBe(2);
         });

      });
   });
}


