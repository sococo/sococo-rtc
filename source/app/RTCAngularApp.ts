/*!
 * Sococo.RTC (http://github.com/sococo/sococo-rtc/)
 * Copyright 2014 Social Communications Company
 * Licensed under MIT (https://github.com/sococo/sococo-rtc/blob/master/LICENSE)
 */

module SococoRTCApp {
   declare var angular:any;
   declare var SRTC:any;
   declare var attachMediaStream;
   export var app = angular.module('sococoRTC', [
      // Cookies are used to retain generated user ID when refreshing the browser.
      'ngCookies'
   ]);

   app.controller('SococoRTCApp',function ($scope,$cookies){

      if(typeof $cookies.localPeerId !== 'undefined'){
         $scope.localPeerId = $cookies.localPeerId;
      }
      else{
         $cookies.localPeerId = $scope.localPeerId = '' + Math.floor((Math.random() * 1000000000 - 5) + 1) + 5;
      }

      console.log("My peer is : " + $scope.localPeerId);
      $scope.peers = [];
      $scope.userName = "Unknown User";
      $scope.localVideo = null;


      $scope.init = function(socketPort:string,socketMount:string,channel:string){
         $scope.initialized = true;
         var host = (<any>location).origin
            .replace(/^([a-zA-z]+):\/\//, '')
            .replace(/:(\d+)$/,':' + socketPort);
         $scope.localPeer = new SRTC.LocalPeerConnection({
            location:channel,
            localId:$scope.localPeerId,
            serverUrl:host,
            serverMount:socketMount
         });
         $scope.peers = $scope.localPeer.peers;

         // Tell Angular to update scope bindings.
         $scope.localPeer.on('addPeer removePeer',function() {
            $scope.$apply();
         });
      };

      /* Toggle buttons for Listen/AudioShare/VideoShare */
      $scope.listen = true;
      $scope.talk = $scope.video = false;
      $scope.toggleListen = function(){
         $scope.listen = !$scope.listen;
         $scope.localPeer.properties.receiveAudio = $scope.listen;
         $scope.localPeer.dirtyProperties();
      };
      $scope.toggleTalk = function(){
         $scope.talk = !$scope.talk;
         $scope.localPeer.properties.sendAudio = $scope.talk;
         $scope.localPeer.dirtyProperties();
      };
      $scope.toggleVideo = function(){
         $scope.video = !$scope.video;
         $scope.localPeer.properties.sendVideo = $scope.video;
         $scope.localPeer.dirtyProperties();
      };
   });
   app.directive('scLocalPeer', function ($compile) {
      return {
         restrict: 'A',
         scope:true,
         link: function ($scope, $element, $attrs) {
            var videoElement = $element[0];
            $scope.$watch($attrs.localpeer, function(localPeer) {
               if(localPeer){
                  function updateStream(){
                     videoElement.muted = true;
                     attachMediaStream(videoElement,localPeer.localStream);
                     if(localPeer.localStream){
                        videoElement.play();
                     }
                     $scope.$$phase || $scope.$digest();
                  }
                  localPeer.on('updateStream',updateStream);
                  updateStream();
               }
            });
         }
      };
   });
   app.directive('scPeer', function ($compile) {
      return {
         restrict: 'A',
         scope:true,
         link: function ($scope, $element, $attrs) {
            var videoElement = $element[0];
            $scope.$watch($attrs.peer, function(peer) {
               if(peer){
                  function updateStream(){
                     if(peer.remoteStream){
                        attachMediaStream(videoElement,peer.remoteStream);
                        videoElement.play();
                     }
                     $scope.$$phase || $scope.$digest();
                  }
                  peer.on('addStream removeStream',updateStream);
               }
            });
         }
      };
   });
}

