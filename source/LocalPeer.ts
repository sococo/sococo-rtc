/// <reference path="./types/MediaStream.d.ts"/>
/// <reference path="./types/RTCPeerConnection.d.ts"/>
/// <reference path="./Events.ts" />
/// <reference path="./PeerConnection.ts" />


module Sococo.RTC {
   declare var Faye:any;

   //--------------------------------------------------------------------------
   // Application Interfaces
   //--------------------------------------------------------------------------
   export interface PeerChannelProperties {
      location:string;
      localId:string;
      serverUrl:string;
      serverMount:string; // e.g. "/faye"
   }

   export interface PeerProperties {
      sendVideo:boolean; // Whether to broadcast video
      sendAudio:boolean; // Whether to broadcast audio
      receiveVideo:boolean; // Whether to receive video
      receiveAudio:boolean; // Whether to receive audio
   }

   /**
    * Manage a set of mesh-style P2P peer connections.
    *
    * @extends {Sococo.Events}
    */
   export class LocalPeerConnection extends Events {
      config:PeerChannelProperties;
      peers:{
         [id:string]:Sococo.RTC.PeerConnection
      } = {};
      private _properties:PeerProperties = {
         sendVideo:false,
         sendAudio:false,
         receiveVideo:true,
         receiveAudio:true
      };
      pipe:any; // TODO: Faye.Client in DefinitelyTyped?
      constructor(config:PeerChannelProperties){
         super();
         this.config = config;
         this.pipe = new Faye.Client(this.getServerEndpoint());
         this.pipe.connect(() => {
            this._onConnect();
         });
      }

      getZoneChannel():string {
         return '/' + this.config.location;
      }

      getServerEndpoint():string {
         var protocol = '//';
         var host = this.config.serverUrl || 'localhost:4202';
         return protocol + host + (this.config.serverMount || '/');
      }
      addPeer(remoteId:string){
         if(remoteId === this.config.localId){
            return;
         }
         var peer:PeerConnection = this.peers[remoteId];
         if(typeof peer !== 'undefined'){
            this.peers[remoteId].destroy();
         }
         peer = this.peers[remoteId] = new PeerConnection({
            pipe: this.pipe,
            zoneId: this.config.location,
            localId: this.config.localId,
            remoteId: remoteId
         }, this._properties);

         // Bubble up add/remove stream messages for the UI to key off of.
         peer.on('addStream',(stream) => {
            this.trigger('addStream',{ stream: stream, userId:remoteId });
         });
         peer.on('removeStream',(stream) => {
            this.trigger('removeStream',{ stream: stream, userId:remoteId });
         });
         peer.on('updateStream',(stream) => {
            this.trigger('updateStream',{stream:stream,userId:remoteId});
         });

         // Negotiate an offer when the connection is ready.
         peer.on('ready',() => {
            peer.off('ready',null,this);
            peer.negotiateProperties(this._properties);
         });

         // Remove peers that timeout
         peer.on('timeout',() => {
            console.warn("Peer Timeout: " + remoteId);
            peer.off();
            this.removePeer(remoteId);
         });

      }

      removePeer(remoteId:string){
         var pc:PeerConnection = this.peers[remoteId];
         if(!pc){
            return;
         }
         pc.destroy();
         pc.off();
         delete this.peers[remoteId];
      }

      destroy(){
         for(var key in this.peers){
            if(this.peers.hasOwnProperty(key)){
               this.peers[key].destroy();
            }
         }
         this.peers = {};

         this.pipe.publish(this.getZoneChannel(),{
            type:'leave',
            userId:this.config.localId
         });
         this.pipe.disconnect();
      }

      //-----------------------------------------------------------------------
      // Private implementation
      //-----------------------------------------------------------------------

      private _onConnect(){
         var zoneChannel = this.getZoneChannel();
         var sub = this.pipe.subscribe(zoneChannel, (data) => {
            if(data.userId !== this.config.localId){
               this._handleZoneMessage(data);
            }
         });
         sub.callback(() => {
            //console.log("Subscribed to zone channel: " + zoneChannel);
            this.pipe.publish(zoneChannel, {
               type: "join",
               userId: this.config.localId
            });
         });
         sub.errback(() => {
            console.error("failed to subscribe to",zoneChannel);
         });
      }

      private _handleZoneMessage(data) {
         switch (data.type) {
            case "join":
               //console.log("User joined, send our ID - " + this.config.localId);
               this.pipe.publish(this.getZoneChannel(),{
                  type:'user',
                  userId:this.config.localId
               });
               this.addPeer(data.userId);
               break;
            case "user":
               //console.log("Adding peer" + data.userId);
               this.addPeer(data.userId);
               break;
            case "leave":
               //console.log("Removing peer" + data.userId);
               this.removePeer(data.userId);
               break;
            default:
               console.log("unhandled message:",data);
         }
      }

   }
}