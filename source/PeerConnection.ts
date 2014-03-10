/// <reference path="./types/MediaStream.d.ts"/>
/// <reference path="./types/RTCPeerConnection.d.ts"/>
/// <reference path="./Events.ts" />
/// <reference path="./LocalPeer.ts" />

module Sococo.RTC {
   declare var createIceServer:any;
   if(typeof createIceServer === 'undefined'){
      createIceServer = function(a,b,c){};
   }

   export var PCIceServers = {
      'iceServers': [
         createIceServer("stun:stun.l.google.com:19302"),
         createIceServer("stun:stun1.l.google.com:19302"),
         createIceServer("stun:stun2.l.google.com:19302"),
         createIceServer("stun:stun3.l.google.com:19302"),
         createIceServer("stun:stun4.l.google.com:19302")
      ]
   };

   export interface IPeerOffer {
      sdp:string;
      type:string;
   }

   export interface PeerConnectionConfig {
      pipe:any; // Faye.Client
      zoneId:string;  // Unique ID for zone
      localId:string; // Unique ID for local peer
      remoteId:string;// Unique ID for remote peer
   }

   /**
    * A connection between the current user and a peer.  Allows p2p offer/answer
    * and negotiation of media streams between two users.
    */
   export class PeerConnection extends Events {
      connection:RTCPeerConnection = null;
      config:PeerConnectionConfig;
      pipe:any; // TODO: Faye.Client?
      localStream:LocalMediaStream;
      remoteStream:MediaStream;

      // Default config is to only receive audio.
      properties:PeerProperties = null;

      constraints:any = {
         mandatory: {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
         },
         // Firefox requires DTLS, so add support for it when needed.
         optional: [{DtlsSrtpKeyAgreement: true }]
      };

      private _glareValue:number = -1;

      // Store a queue of ice candidates for processing.
      // This is because candidates may not be added before setRemoteDescription
      // has been called.  This usually works out as the offer will arrive before
      // any candidates, and it will call setRemoteDescription, but sometimes it
      // does not.   We can't guarantee that whatever signaling system you use
      // will provide messages in the order sent, so we enforce delayed processing
      // of candidates until after setRemoteDescription is called.
      private _iceCandidateQueue:any[] = [];

      constructor(config:PeerConnectionConfig,props:PeerProperties){
         super();
         this.config = config;
         this.properties = props;
         this.pipe = this.config.pipe;
         var peerChannel = this.getPeerChannel();
         //console.warn("Subscribing to peer: \n",peerChannel);
         var sub = this.pipe.subscribe(peerChannel, (data) => {
            // Only process remote peer messages.
            if(data.userId !== this.config.localId){
               this._handlePeerMessage(data);
            }
         });
         sub.callback(() => {
            //console.warn("Subscribed to peer channel: \n",peerChannel);
            this.createConnection();
            this.trigger('ready');
         });
         sub.errback(() => {
            console.error("failed to subscribe to",peerChannel);
         });
      }


      // Re/initialize the RTCPeerConnection between `config.localId` and `config.remoteId` peers.
      createConnection(){
         console.warn("----------------------- New RTCPeerConnection");
         this.destroyConnection();
         this.connection = new RTCPeerConnection(PCIceServers,this.constraints);
         this.connection.onaddstream = (event) => {
            this.onAddStream(event);
         };
         this.connection.onicecandidate = (event) => {
            this.onIceCandidate(event);
         };
         this.connection.onremovestream = (event) => {
            this.onRemoveStream(event);
         };
      }
      destroyConnection(){
         if(this.connection){
            this.connection.close();
            this.connection = null;
         }
         if(this.remoteStream){
            this.trigger('removeStream',this.remoteStream);
         }
         this.trigger('updateStream',this.localStream);
         this.remoteStream = this.connection = null;
         this._glareValue = -1;
      }

      // Signal glare handling.
      isOffering():boolean {
         return this._glareValue != -1;
      }

      private _rollGlareValue():number {
         var min:number = 0;
         var max:number = 2048;
         return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      send(data:any){
         data = data || {};
         data.userId = this.config.localId;
         this.pipe.publish(this.getPeerChannel(),data);
      }

      setLocalStream(stream:LocalMediaStream) {
         if(stream == this.localStream){
            return;
         }
         var oldStream:LocalMediaStream = this.localStream;
         this.localStream = stream;
         if(this.connection){
            if(oldStream){
               this.connection.removeStream(oldStream);
            }
            if(this.localStream){
               this.connection.addStream(stream);
            }
         }
      }
      // Properties changed, create a new PeerConnection/Offer with the desired properties.
      // The Peer should answer with their given properties.
      negotiateProperties(props:PeerProperties){
         console.warn("---> : Negotiate connection.");
         if(typeof props.sendAudio !== 'undefined'){
            this.properties.sendAudio = props.sendAudio;
         }
         if(typeof props.sendVideo !== 'undefined'){
            this.properties.sendVideo = props.sendVideo;
         }
         if(typeof props.receiveAudio !== 'undefined'){
            this.properties.receiveAudio = props.receiveAudio;
         }
         if(typeof props.receiveVideo !== 'undefined'){
            this.properties.receiveVideo = props.receiveVideo;
         }
         this._negotiateRequest();
      }

      answerWithProperties(offer:IPeerOffer,done?:(error?) => void){
         var msg:string = "---> : Answering peer offer";
         if(!this.connection){
            this.createConnection();
         }
         if(this.localStream && this.connection){
            this.connection.addStream(this.localStream);
            msg += " (broadcast)";
         }
         console.warn(msg);
         this.describeRemote(offer,(err?) => {
            if(!err){
               this.answer(offer,done);
            }
            else{
               console.error(err);
               done && done(err);
            }
         });
      }

      getPeerChannel():string {
         var inputs = [
            this.config.zoneId,
            this.config.localId,
            this.config.remoteId
         ];
         return '/' + inputs.sort().join('/');
      }

      destroy() {
         if(this.connection){
            this.pipe && this.send({type:'close'});
            this.connection.close();
            this.connection = null;
            if(this.remoteStream){
               this.trigger('removeStream',this.remoteStream);
               this.remoteStream = null;
            }
         }
      }

      updateConstraints() {
         this.constraints.mandatory.OfferToReceiveAudio = this.properties.receiveAudio === true;
         this.constraints.mandatory.OfferToReceiveVideo = this.properties.receiveVideo === true;
      }

      onIceCandidate(evt){
         var candidate = evt.candidate;
         if(candidate && this.isOffering()){
            this.send({
               type:'ice',
               glare:this._glareValue,
               candidate: JSON.stringify(candidate)
            });
         }
      }

      onAddStream(evt) {
         // TODO: Support multiple streams across one Peer.
         // Need to track the streams here, and be sure to clean them
         // up on destruction.
         console.warn('--- Add Remote Stream');
         this.remoteStream = evt.stream;
         this.trigger('addStream',evt.stream);
      }
      onRemoveStream(evt) {
         console.warn('--- Remove Remote Stream');
         this.trigger('removeStream',evt.stream);
         this.remoteStream = null;
      }

      offer(done?:(error?:any,offer?:any) => void, peerId:string=null){
         if(this.isOffering()){
            console.error("Tried to send multiple peer offers at the same time.");
            return;
         }
         this._glareValue = this._rollGlareValue();
         var peerChannel = this.getPeerChannel();
         var self = this;
         var offerCreated = (offer) => {
            this.connection.setLocalDescription(offer,() => {
               self.send({
                  type:'offer',
                  glare:this._glareValue,
                  offer: JSON.stringify(offer)
               });
               done && done(null,offer);
            },offerError);
         };
         var offerError = (error) => {
            console.warn("ERROR creating OFFER",error);
            done && done(error);
         };
         this.updateConstraints();
         this.connection.createOffer(offerCreated,offerError,this.constraints);
      }

      answer(offer:any, done?:(error?:any,offer?:any) => void){
         var answerCreated = (answer) => {
            this.connection.setLocalDescription(answer,() => {
               this.send({
                  type:'answer',
                  glare:this._glareValue,
                  answer: JSON.stringify(answer)
               });
               done && done(null,answer);
            },answerError);
         };
         var answerError = (error) => {
            done && done(error);
         };
         this.updateConstraints();
         this.connection.createAnswer(answerCreated,answerError,this.constraints);
      }

      describeLocal(offer, done?:(error?) => void) {
         var descCreated = () => { done && done(); };
         var descError = (error) => { done && done(error); };
         this.connection.setLocalDescription(new RTCSessionDescription(offer),descCreated,descError);
      }
      describeRemote(offer, done?:(error?) => void) {
         var descCreated = () => { done && done(); };
         var descError = (error) => { done && done(error); };
         this.connection.setRemoteDescription(new RTCSessionDescription(offer),descCreated,descError);
      }

      //-----------------------------------------------------------------------
      // PeerConnection Renegotiation
      //-----------------------------------------------------------------------

      _negotiateRequest(){
         console.warn("---> : Send (re)negotiation request");
         this.send({
            type:'negotiate'
         });
      }

      _negotiateAcknowledge(data:any){
         console.warn("---> : Send (re)negotiation acknowledgement");
         this.send({
            type:'negotiate-waiting'
         });
         this.createConnection();
      }

      _negotiateGo(data:any){
         this.createConnection();
         if(this.localStream){
            this.connection.addStream(this.localStream);
         }
         this.offer((error?:any,offer?:any) => {
            if(error) {
               console.error(error);
            }
         });
      }

      //-----------------------------------------------------------------------
      // Ice Candidate Processing
      //  - Handle race conditions with offer by queuing ice candidates
      //    until setRemoteDescription is called.
      //-----------------------------------------------------------------------
      private _processIceQueue(){
         var queue = this._iceCandidateQueue;
         for(var i:number = 0; i < queue.length; i++){
            var msg = queue[i];
            this._handleIceCandidate(msg);
         }
         this._iceCandidateQueue = [];
      }

      private _handleIceCandidate(data:any){
         var candidate = JSON.parse(data.candidate);
         if(candidate && data.glare === this._glareValue){
            try{
               this.connection.addIceCandidate(new RTCIceCandidate(candidate));
               return true;
            }
            catch(e){
               console.error("Failed candidate --- " + candidate, e);
            }
         }
         return false;
      }

      //-----------------------------------------------------------------------
      // Messaging
      //-----------------------------------------------------------------------
      private _handlePeerMessage(data:any){
         switch(data.type){
            case "offer":
               console.warn("<--- : Receive peer offer, glare=" + data.glare);
               if(this.isOffering()){
                  if(data.glare === this._glareValue){
                     console.warn("       DISCARDED: glare values matched.  Retry.");
                     this.createConnection();
                     this.offer();
                     return;
                  }
                  else if(data.glare > this._glareValue){
                     console.warn("       DISCARD LOCAL: Signal Glare, old=" + this._glareValue);
                     this.createConnection();
                     this._glareValue = data.glare;
                  }
                  else if(data.glare < this._glareValue){
                     console.warn("       DISCARD REMOTE: Signal Glare, old=" + this._glareValue);
                     return;
                  }

               }
               var offer = JSON.parse(<any>data.offer);
               this.answerWithProperties(offer,(err?) => {
                  if(typeof err === 'undefined'){
                     this._glareValue = data.glare;
                     this._processIceQueue();
                  }
               });
               break;
            case "answer":
               var answer = JSON.parse(data.answer);
               console.warn("<--- : Receive peer answer");
               if(this.isOffering()){
                  if(data.glare !== -1 && data.glare !== this._glareValue){
                     console.warn("       DISCARDED: Signal Glare");
                     return;
                  }
               }
               this.describeRemote(answer,(err?) => {
                  if(err){
                     console.error(err);
                  }
                  this._glareValue = -1;
               });
               break;
            case "ice":
               if(!this._handleIceCandidate(data)){
                  this._iceCandidateQueue.push(data);
               }
               break;
            case "negotiate":
               console.warn("<--- : Receive peer (re)negotiation request");
               // Peer wants to negotiate a new connection.  acknowledge the request, replace
               // any existing RTCPeerConnection, and wait for a new offer.
               this._negotiateAcknowledge(data);
               break;
            case "negotiate-waiting":
               console.warn("<--- : Receive peer (re)negotiation acknowledgment");
               // Peer is waiting for a new offer in response to a 'negotiate' request.  Create
               // a new RTCPeerConnection, and send an offer to the user.
               this._negotiateGo(data);
               break;
            case "close":
               if(this.remoteStream){
                  this.trigger("removeStream",this.remoteStream);
                  this.remoteStream = null;
               }
               break;
         }
      }

   }
}