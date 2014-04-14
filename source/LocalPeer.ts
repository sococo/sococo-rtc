/*!
 * Sococo.RTC (http://github.com/sococo/sococo-rtc/)
 * Copyright 2014 Social Communications Company
 * Licensed under MIT (https://github.com/sococo/sococo-rtc/blob/master/LICENSE)
 */

/// <reference path="../types/rtc/MediaStream.d.ts"/>
/// <reference path="../types/rtc/RTCPeerConnection.d.ts"/>
/// <reference path="./Events.ts" />
/// <reference path="./PeerConnection.ts" />


module SRTC {
   declare var Faye:any;
   declare var require:any;
   declare var getUserMedia:any;

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
         [id:string]:SRTC.PeerConnection
      } = {};
      properties:PeerProperties = {
         sendVideo:false,
         sendAudio:false,
         receiveVideo:true,
         receiveAudio:true
      };
      localStream:LocalMediaStream = null;

      private _keepAliveInterval:number;

      pipe:any; // TODO: Faye.Client in DefinitelyTyped?
      constructor(config:PeerChannelProperties){
         super();
         this.config = config;
         if(typeof Faye === 'undefined'){
            Faye = require('faye');
         }
         this.pipe = new Faye.Client(this.getServerEndpoint());
         this.pipe.connect(() => {
            this._onConnect();
         });
      }

      getZoneChannel():string {
         return '/' + this.config.location;
      }

      getServerEndpoint():string {
         var protocol = typeof require === 'undefined' ? '//' : 'http://';
         var host = this.config.serverUrl || 'localhost:4202';
         return protocol + host + (this.config.serverMount || '/');
      }


      //-----------------------------------------------------------------------
      // Peer Management functions

      addPeer(remoteId:string,negotiate:boolean=false){
         if(remoteId === this.config.localId){
            return;
         }
         var peer:PeerConnection = this.peers[remoteId];
         if(typeof peer !== 'undefined'){
            // Clear the heartbeat so that the peer will
            // initiate a new heartbeat.  This is needed
            // when a browser page is refreshed, for example.
            peer.clearHeartbeat();
            return;
         }
         peer = this.peers[remoteId] = new PeerConnection({
            pipe: this.pipe,
            zoneId: this.config.location,
            localId: this.config.localId,
            localStream:this.localStream || null,
            remoteId: remoteId
         }, this.properties);

         // Negotiate an offer when the connection is ready.
         peer.on('ready',() => {
            peer.off('ready',null,this);
            if(negotiate === true){
               peer.negotiateProperties(this.properties);
            }
         });

         // Remove peers that timeout
         peer.on('timeout',() => {
            console.warn("Peer Timeout: " + remoteId);
            peer.off();
            this.removePeer(remoteId);
         });

         console.warn("--------------Add Peer " + remoteId);
         this.trigger('addPeer',peer);

      }

      removePeer(remoteId:string){
         console.warn("--------------Remove Peer " + remoteId);
         var pc:PeerConnection = this.peers[remoteId];
         if(!pc){
            return;
         }
         pc.destroy();
         pc.off();
         delete this.peers[remoteId];
         this.trigger('removePeer',pc);
         pc = null;
      }

      //-----------------------------------------------------------------------

      dirtyProperties() {
         var props:PeerProperties = this.properties;
         var needBroadcast:boolean = props.sendAudio === true || props.sendVideo === true;
         var _syncProperties = () => {
            // Iterate over our peer connections and prune any that aren't valid users.
            for(var key in this.peers){
               if(this.peers.hasOwnProperty(key)){
                  var pc:PeerConnection = this.peers[key];
                  pc.localStream = this.localStream;
                  pc.negotiateProperties(props);
               }
            }
         };
         if(needBroadcast){
            var constrainedMedia = {
               video:this.properties.sendVideo,
               audio:this.properties.sendAudio
            };
            getUserMedia(constrainedMedia, (stream) => {
               this.localStream = stream;
               _syncProperties();
               this.trigger('updateStream');
            },(error) => { console.error(error); });
         }
         else {
            if(this.localStream){
               if(this.localStream.stop){
                  this.localStream.stop();
               }
               this.localStream = null;
               this.trigger('updateStream');
            }
            _syncProperties();
         }
      }


      getVideoConstraints():any{
         var resolution = {
            mandatory: {
               minWidth: 320,
               minHeight: 180,
               maxWidth: 320,
               maxHeight: 180
            },
            "optional": []
         };
         return !this.properties.sendVideo ? false : resolution;
      }


      destroy(){
         for(var key in this.peers){
            if(this.peers.hasOwnProperty(key)){
               this.peers[key].destroy();
            }
         }
         this.peers = {};

         clearInterval(this._keepAliveInterval);
         this._keepAliveInterval = null;

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

            this._keepAliveInterval = this._keepAliveInterval || setInterval(() => {
               this.pipe.publish(this.getZoneChannel(),{type:"ping"});
            },5000);
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
               console.warn("MSG: User");
               this.addPeer(data.userId,true);
               break;
            case "leave":
               //console.log("Removing peer" + data.userId);
               this.removePeer(data.userId);
               break;
            case "ping":
               break;
            default:
               console.log("unhandled message:",data);
         }
      }

   }
}