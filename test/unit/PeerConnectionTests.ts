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
      var local:SRTC.PeerConnection;
      var remote:SRTC.PeerConnection;

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


      it('should generate deterministic channel names', () => {
         expect(local.getPeerChannel()).toBe(remote.getPeerChannel());
      });

      it('should connect and signal ready', (done) => {
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


      it('should successfully offer media to each other', (done) => {
         var remaining:number = 2;
         var decrement = () => {
            remaining--;
            if(remaining <= 0){
               next();
            }
         };
         var next = () => {
            next = done;
            remaining = 2;
            local.off();
            remote.off();
            local.negotiateProperties(peerProperties);

            // Firefox errors without a media stream
            if((<any>window).webrtcDetectedBrowser=='firefox'){
               local.on('error',() => {
                  done();
               });
            }
            // Chrome/Opera will still generate an SDP.
            else {
               local.on('connected', decrement);
               remote.on('connected', decrement);
            }
         };
         local.on('ready',decrement);
         remote.on('ready',decrement);
         local.connect();
         remote.connect();
         expect(pipe.subscribedChannels[local.getPeerChannel()]).toBe(2);
      });
   });
}


