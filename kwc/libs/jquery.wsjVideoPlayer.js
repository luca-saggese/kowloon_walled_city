jQuery.fn.extend({
    WSJVideo: function (config) {
		"use strict";
		var self = $(this);
		var containerId = self.attr('id');
		var videoId = self.attr('id')+"_video"; 
		/*
		var callback;
		if(config.callback){
			callback = config.callback;
		}else{
			callback = self.attr('id')+"_video";
		}
		*/
		var isAdvert = false;
		var endListener = false;
		var videoTag;
		var dataLoaded;
		var loadedData;
		var trackingMilestones = [false,false,false,false];
		var initTracked = false;
		var contentStartTracked = false;
		var pingMilestone = 0;
		var callback = containerId.replace(/[^a-zA-Z0-9]/g, '');
		var timer;
		var now = new Date();
		var start = new Date();
		var end;
		var second = 1000;
		var minute = second * 60;
		var hour = minute * 60;
		var day = hour * 24;
		var autoString;
		var protocol = "http://";
		var configLoaded = !("playerid" in config);
		var htmlControlsInstance;
		var contentInitialized = false;
		var adsLoaded = false;
		var imaLoaded = false;
		
		// functions //
		var setupThumbnail;
		var loadWSJMediaPlayer;
		var playVideo;
		var timeChange;
		var adComplete;
		var adSkipped;
		var adError;
		var adStarted;
		var complete;
		var initialized;
		var flashInitialized;
		var flashContentStarted;
		var flashStateChange;
		var contentStarted;
		var videoFail;
		var initHTML5;
		var swfObjectStatus, onJavaScriptBridgeCreated, videoProgress;
		var videoComplete, generateEndscreen;
		var onPlaying, onPlay, onError, onPause;
		var onAdStarted, onAdError, onPauseRequested, onResumeRequested, getAdTag, onAdsLoaded, onAdComplete, onNewVideo, onReplayVideo, onLoadedMetadataHtml, requestAd, onSkip, onAdClicked, onResize, onPlayerExitFullscreen; 
		var playVideoFromEndScreen, externalPlayVideo;
		var jsonReceived;
		var externalConfig;
		var fields = 'fields=video128kMP4Url,video174kMP4Url,video264kMP4Url,video464kMP4Url,video664kMP4Url,video1264kMP4Url,hls,adZone,thumbnailList,guid,state,secondsUntilStartTime,author,description,name,linkURL,videoStillURL,duration,videoURL,adCategory,catastrophic,linkShortURL,doctypeID,youtubeID,video320kMP4Url,titletag,rssURL,wsj-section,wsj-subsection,allthingsd-section,allthingsd-subsection,sm-section,sm-subsection,provider,formattedCreationDate,keywords,keywordsOmniture,column,editor,emailURL,emailPartnerID,showName,omnitureProgramName,omnitureVideoFormat,omniturePublishDate&callback=?';
		var cast_api, chromecastReceivers, onReceiverList, cv_activity, statInt, chromecastVideo, currentMediaURL;
		var isInIframe = false;
		var moduleId;
		var chromecastCurrentTime = 0;
		
		// CHROMECAST //
		//var appId = '8D9EB2D1';
		var appId = '40356514'; // Production
		//var appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
		var session = null;
		var currentMediaSession = null;
		var castAppName = "WSJ";
		// var castAppName = "testapp";
		var receiverAvailable = false;
		var mediaNamespace = 'urn:x-cast:com.wsj.video';
		
		// IMA3 //
		var adDisplayContainer;
		var adsContainerInit = false;
		
		var defaults = {
			height: $(this).height(),
			width: $(this).width(),
			autoplay: true,
			adsEnabled: true,
			shareEnabled: true,
			chainVideos:false,
			disableHtmlControls: false,
			api:"/api-video/",
			clickForSound: false,
			skynetEnable: false,
			skynetServer: "http://skynet-command-prod.elasticbeanstalk.com",
			skynetRecServer: "http://skynet-service-prod.elasticbeanstalk.com/",
			userUri: "http://system.marketwatch.com/user/anonymous/",
			resetOnComplete:false,
			type:"",
			query:"",
			contentType: "article",
			disableEndscreen:false,
			noThumb: false,
			larsId: "91",
			larsAdId: "1259",
			larsChrome: "1272",
			disableSeekBarThumbnails:true,
			allowFullScreen:true,
			adTag:'',
			useHttps:false,
			count:1,
			moduleId:"",
			disablePreroll:false,
			clickForSoundPreroll:false,
			adZone:"",
			collapseable:false,
			disableDVR:null,
			maxBitrateIndex:null,
			enableCaptions:true,
			loaderThumb:false,
			chromecastEnabled:true,
			disableAdSkipping:false,
			playlist:null,
			imaLibrary:"https://s0.2mdn.net/instream/html5/ima3.js",
			site:""
		};
		
		var comscoreC3 = "13047035";
		
		var player;
		var settings = $.extend(defaults, config);
		var playlist;
		var videodata;
		var prerollPlayed = false;
		var isLive = false;

		// ADS //
		var adsManager;
		var adsLoader;
		var videoElement; 

		var adDisplayContianer;
		var adData;
		var selectedReceiver;
		
		$(this).css("background-color","#000000");
		
		
		window.onerror = function(){ };
		try{
			if(settings.chromecastEnabled){
				if (chrome.cast && !chrome.cast.isAvailable) {
				  setTimeout(initializeCastApi, 1000);
				}
			}
		}catch(e){}
		
		function initializeCastApi() {
		  var sessionRequest = new chrome.cast.SessionRequest(appId);
		  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
			sessionListener,
			receiverListener);
		  chrome.cast.initialize(apiConfig, chromeOnInitSuccess, chromeOnError); 
		};
		
		function receiverListener(e) {
		  	if( e === 'available' ) {
				receiverAvailable = true;
			}
		  	else {
				receiverAvailable = false;
			}
			try{
				$('#'+videoId).trigger("receiverChanged", [receiverAvailable]);
				if(player)
					player.setReceiverAvailable(receiverAvailable); 
			}catch(e){}
			
		}
		
		function chromeOnInitSuccess() {
		}
		
		function chromeOnError(err) {
		}
		
		function sessionListener(e) {
		  session = e;
		  if (session.media.length != 0) {
			onMediaDiscovered('onRequestSessionSuccess_', session.media[0]);
		  }
		  session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
		  session.addUpdateListener(sessionUpdateListener.bind(this));  
		  session.addMessageListener(mediaNamespace, onChromeMessage);
		}
		
		function sessionUpdateListener(isAlive) {
			var message = isAlive ? 'Session Updated' : 'Session Removed';
			message += ': ' + session.sessionId;
			try{
				if (!isAlive) {
					session = null;
					player.chromecastSessionKilled();
				}
			}catch(e){}
		};
		
		function sendMsg() {
			if( !session ) 
				return;
		
			session.sendMessage(mediaNamespace, {data:'MESSAGE!!!', type:'status'}, function(){
								
			},
			function(castError){});
		}
		
		function onMediaDiscovered(how, mediaSession) {
		  currentMediaSession = mediaSession;
		  mediaSession.addUpdateListener(onMediaStatusUpdate);
		  chromecastCurrentTime = currentMediaSession.currentTime;
		}
		
		function onMediaError(e) {

		}
		
		function onMediaStatusUpdate(isAlive) {
			try{
				if(player && currentMediaSession){
					player.chromecastMessage({type:"progress", position:currentMediaSession.currentTime, duration:currentMediaSession.media.duration});
					player.chromecastMessage({type:"status", status:currentMediaSession.playerState});	
					var percent = currentMediaSession.currentTime / currentMediaSession.media.duration;
					if(currentMediaSession.media.duration > 0){
						uProgress(percent,currentMediaSession.currentTime , false, true );
					}
				}
			}catch(e){}
			try{
				if(!isAlive || currentMediaSession.playerState == chrome.cast.media.PlayerState.IDLE){
					player.chromecastMediaEnded();
				}
			}catch(e){}
		}
		
		function launchApp() {
		  chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
		}

		function onRequestSessionSuccess(e) {
			session = e;
			session.addMessageListener(mediaNamespace, onChromeMessage);
			session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
  			session.addUpdateListener(sessionUpdateListener.bind(this)); 
			try{
				$.ajax({
			  		url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsChrome+"&guid={"+settings.guid+"}",
			  		dataType: "jsonp"
			});}catch(e){}
			if(player){
		  		player.chromecastSessionStarted(e);
			}else{
				$('#'+videoId).trigger("chromecastSessionStarted", videodata);	
			}
		}
		
		function showChromeCastDisplay(){
			var chromeDisplay = '<div id="chromeDisplay">';
			$.each(videos, function(key, val) {
			//	thumbshtml += '<li class="video-archive'+exStyle+'" id="video_' + key + '">';
			//	thumbshtml += '<a class="endscreenThumb" rel="' + key + '">';
			//	thumbshtml += '<div class="playlistDescription"><div>'+val.name+'</div></div>';
			//	thumbshtml += '<img src=\"' + val.videoStillURL + '\" alt="' + val.name + '" /></a>';
			//	thumbshtml += "</li>";
			});
			thumbshtml += '</div>';
			//$('#playlist').css("height", settings.height);
			//$('#playlist').css("width", settings.width);
			$('#chromeDisplay').empty();
			$('#chromeDisplay').append(thumbshtml);
			$('.endscreenThumb').click(playVideoFromEndScreen);
			
			$('#playlist_'+videoId).fadeIn("slow");	
		}
		
		function onChromeMessage(event, data){
			var msg = JSON.parse(data);
			if(msg.type == "progress" && currentMediaSession){
			  	//var pct = parseInt(100 * currentMediaSession.currentTime / currentMediaSession.media.duration);
				player.chromecastMessage({type:"progress", position:currentMediaSession.currentTime, duration:currentMediaSession.media.duration});
			}
		}
		
		function onLaunchError(e) {

		}
		
		window['setReceiver'+callback] = function(idx, id, videoData) {
			if(id == "HomeDevice" && cv_activity != null){
				stopActivity();
			}else{
				selectedReceiver = chromecastReceivers[idx];
				chromecastVideo = videoData;
				for (var i=0;i<chromecastReceivers.length;i = i + 1){ 
					if(chromecastReceivers[i].id == id){
						selectedReceiver = chromecastReceivers[i];
						break;
					}
				}
				doLaunch(selectedReceiver, videoData);
			}
		};
		
		window['setChromeCastMedia'+callback] = function(idx, videoData) {
			if (!session) {
				return;
			}
			//currentMediaURL = videoData.hls;
			//currentMediaURL = "http://wsjvod-i.akamaihd-staging.net/i/video/20140129/012914hubamsochi/012914hubamsochi_v2_ec,464,174,264,664,1264,1864,2564,k.mp4.csmil/master.m3u8";
			currentMediaURL = videoData.vod[6];
			if(!currentMediaURL){
				try{
					player.chromecastSessionKilled();
					session.stop();
				}catch(e){}
			}else{
				var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
				mediaInfo.contentType = 'video/mp4';
				mediaInfo.customData = videoData;
				var request = new chrome.cast.media.LoadRequest(mediaInfo);
				request.autoplay = true;
				session.loadMedia(request, onMediaDiscovered.bind(this, 'loadMedia'),onMediaError);
			}
		};
		
		window['setChromeCastChaining'+callback] = function(idx, videoData) {
			if (!session) {
				return;
			}
			session.sendMessage(mediaNamespace, {data:videoData, type:'chaining'}, function(){
			
			},
			function(castError){

			});
		};
		
		window['setChromeCastChainTime'+callback] = function(idx, time) {
			if (!session) {
				return;
			}
			session.sendMessage(mediaNamespace, {data:time, type:'chainingCount'}, function(){
		
			},
			function(castError){});
		};

		window['setChromeCastSeek'+callback] = function(idx, seekTime) {
			if(currentMediaSession){
			  var request = new chrome.cast.media.SeekRequest();
			  request.currentTime = seekTime;
			  currentMediaSession.seek(request,
				function(e){}, // success 
				function(e){}); // error
			}
		};
		window['setChromeCastPlay'+callback] = function(idx) {
			if(currentMediaSession){
				//var req = new chrome.cast.media.PauseRequest();
				currentMediaSession.play(null,
        			function(e){},
       		 		function(e){});
			}
		};
		window['setChromeCastPause'+callback] = function(idx) {
			if(currentMediaSession){
				currentMediaSession.pause(null,
        			function(e){},
       		 		function(e){});
			}
		};
		
		onResize = function(evt){
			var h = self.find( ".wsjvideo-video-player" ).height();
			var w = self.find( ".wsjvideo-video-player" ).width();
			if(h == 0 && w > 0){
				h = Math.round(.576 * w);	
			}
			if(h > 0){
				$("#"+videoId).width(w);
				$("#"+videoId).height(h);
				$("#adContainer").width(w);
				$("#adContainer").height(h - 32);

				if(adsManager){
					adsManager.resize(w, h - 32,google.ima.ViewMode.NORMAL);
				}
			}
		}
		
		$(document).bind('webkitfullscreenchange', function(e){ 
			onResize();
		});
		
		$(window).resize(function(){ 
			onResize(); 
		});

		$(document).on('pause_'+callback,function(e){ 
			adsManager.pause();
			if(videoTag)
				videoTag.pause();
			if(player)
				player.pauseVideo(); 
		});
		
		$(document).on('resume_'+callback,function(e){ 
			adsManager.pause();
			if(videoTag)
				videoTag.play();
			if(player)
				player.unpauseVideo(); 
		});
		
		$(document).on('playVideo_'+callback,function(e, data){ 
			externalPlayVideo(data);
		});


		// public methods
		this.getStatus = function(){
			var rtn = {status:"playing"};
			if(player){
				return player.getStatus();
			}else if(videoTag){
				return videoTag.paused;
			}
		}
		
		this.pauseVideo = function(){
			if(adsManager)
				adsManager.pause();
			if(videoTag)
				videoTag.pause();
			if(player)
				player.pauseVideo(); 
		}
		
		this.resumeVideo = function(){
			if(adsManager){
				adsManager.resume();
			}
			if(videoTag)
				videoTag.play();
			if(player)
				player.unpauseVideo(); 	
		}
		
		this.isPlaying = function(){
			var rtn = false;
			if(player){
				return player.isPlaying();
			}else if(videoTag){
				return videoTag.paused;
			}
		}
		
		this.updatePlaylist = function(pls){
			settings.playlist = pls;
		}
		
		this.setMute = function(mute){
			if(player){
				return player.setMute(mute);
			}else if(videoTag){
				videoTag.muted = mute; 
				return true;
			}
		}
		
		this.playVideo = function(videoData){
			externalPlayVideo(videoData);	
		}
		
		function onJsonError(event, jqxhr, exception) {
			self.prepend('<p>We are sorry, we are unable to load this video.<br />'+exception+'</p>');
		}
		
		function getVideoContent() { 
			try{
				if (window!=window.top) { 
					if(window.parent.s !== undefined){
						return 	window.parent.s;
					}
				}else{
					if(window.s !== undefined){
						return 	window.s;
					}
				}
				return false;	
			}catch(e){
				return false;	
			}
		} 
		
		function skynetBeacon(){
			try{
				var date = new Date();
				var jData = {userUri: settings.userUri
						   , articleId: settings.guid
						   , eventDateUtc: date.toISOString()
						   , activityType: "read"
				};
				
				$.ajax({
					url: settings.skynetServer + "/v1/users/" + settings.userUri+settings.guid + "/events",
					type: "GET",
					dataType: 'jsonp',
					data: jData,
					contentType: 'application/json; charset=utf-8'
				});	
			}catch(e){

			}
		}
		
		function setTrackingVars(data){

			var pageValues = getVideoContent();
			var isIframe = (window!=window.top);
			var url = (window.location != window.parent.location) ? document.referrer: document.location.href;
			var pageTitle = (window.location != window.parent.location) ? svid.pageName: document.title;
			var channel = "";
			isLive = false;
			if(data.state){
				if(data.state == "live"){
					isLive = true;	
				}
			}
			try{
				if(window['s']){
					channel = s.channel;
				}else{
					channel = getDomain(url);
				}
			}catch(e){
				channel = getDomain(document.domain);
			}

			var prefix = "wsj";
			svid.linkTrackVars="pageName,events,channel,pageType,eVar3,eVar4,eVar10,eVar11,eVar13,eVar14,eVar15,eVar16,eVar17,eVar18,eVar20,eVar21,eVar26,eVar31,eVar32,eVar67,eVar37,eVar38,eVar39,eVar40,eVar53,eVar54,eVar25,eVar55,eVar61,eVar68,eVar25,eVar29,eVar52,eVar66,eVar69,eVar70,eVar75";

			svid.debugTracking 	= 	true;
			svid.trackLocal 	= 	true;
			svid.server			=	"om.dowjoneson.com"; 
			svid.account = "djglobal,djwsjlive";

			try{
				if (url.indexOf("wsj.com") !== -1) { 
					svid.account = "djglobal,djwsj";
				}
				if(url.indexOf('live.wsj.com')!== -1) {
					svid.account = "djglobal,djwsjlive";
				}
				if(url.indexOf("cwsj.com") !== -1) {
					svid.account = "djglobal,djwsjchina";
				}
				if(url.indexOf("cn.wsj.com") !== -1){
					svid.account = "djglobal,djwsjchina";
				}
				if(url.indexOf("jwsj.com") !== -1) { 
					svid.account = "djglobal,djjapanwsj";
				}
				if (url.indexOf("kr.wsj.com") !== -1) { 
					svid.account = "djglobal,djwsjkorea";
				}
				if (url.indexOf("indo.wsj.com") !== -1) { 
					svid.account = "djglobal,djwsjindonesia";
				}
				if (url.indexOf("marketwatch.com") !== -1) { 
					svid.account = "djglobal,djmarketwatch";
				}
				if (url.indexOf("barrons.com") !== -1) { 
					svid.account = "djglobal,djbarrons";
				}
				if (url.indexOf("wsj.de") !== -1) { 
					svid.account = "djglobal,djwsjgermany";
				}
				if(url.indexOf('allthingsd.com')!== -1){
					svid.account = "djglobal,djatd";
				}
				if(url.indexOf('wsj.com.tr')!== -1){
					svid.account = "djglobal,djwsjturkey";
				}
				if(url.indexOf('efinancialnews.com')!== -1){
					svid.account = "djglobal,djefinancialnews";
				}
			}catch(e){
				svid.account = "djglobal,djwsjlive";
			}

			if(channel === false){
				svid.channel		=	"WSJ"; // WSJ, MarketWatch, Barrons Online
			}else{
				svid.channel		=	channel; 
			}
			svid.pageType		=	""; // 
	
			svid.eVar3		=	""; //user uuid
			svid.eVar4		=	pageTitle; 			// page name of page where video is played.
			svid.eVar10		=	"WSJLive_Video_"+data.name+"_"+data.duration;
			svid.eVar11		=	svid.channel;					// WSJDN site where video is being played
			svid.eVar13		=	"video_"+data.doctypeID; 	// doc type ID from player; in old implementation, this went into c8
			svid.eVar14		=	data.adZone; 				// video ad zone; in old implementation, this went into c13
			svid.eVar15		=	"WSJLive_"+data.author; 	// name of video creator; in old implementation, this went into c21
			
			if(settings.showName){
				svid.eVar16		=	"video_"+settings.showName; 
			}else if(data.omnitureProgramName){
				svid.eVar16		=	data.omnitureProgramName; 
			}else{
				svid.eVar16		=	"video_"+data.column; 
			}
			
			if(channel === false){
				svid.eVar17		=	(!isIframe) ? document.domain : "video embedded offsite"; // if viewed offsite, [subdomain.domain.com]
				svid.eVar18		=	"video embedded offsite"; // page name of page where video is played.
				comscoreC3 = "13047035";
			
			}else{
				
				if (channel == "MarketWatch") { comscoreC3 = "13047034"; }
				else if (channel == "Barrons Online") { comscoreC3 = "13047031"; }
				else if(channel == "AllThingsD"){comscoreC3= "13047033";}
				else if(channel == "SmartMoney"){comscoreC3 = "3005492";}
				else if (channel == "FINS") { comscoreC3 = "13047038"; }
				else {comscoreC3 = "13047035";}
				
				if(channel == "AllThingsD"){
					prefix = "allthingsd";
				}else if(channel == "SmartMoney"){
					prefix = "sm";
				}
				svid.eVar17		=	null; // if viewed offsite, [subdomain.domain.com]
				svid.eVar18		=	channel; // page name of page where video is played.
			}
			
			if(data[prefix+'-section']){
				var ln = "WSJLive_Video_"+data[prefix+'-section'];
				if(data[prefix+'-subsection']){
					ln += "_"+data[prefix+'-subsection'];
				}
				svid.eVar20		=	ln; // describes the tabs where video is viewed on the WSJ Live site; in old implementation, this went into c22/c19
			}else{
				svid.eVar20		=	null; // describes the tabs where video is viewed on the WSJ Live site; in old implementation, this went into c22/c19	
			}
			
			svid.eVar21		=	"video_"+data.guid; // page name of page where video is played.
			
			svid.eVar26		=	"WSJ_free"; // whether user is a wsjdn subscriber; in old implementation, this went into c27
			
			var d = new Date();
			var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    		var easternDate = new Date(utc + (3600000*-5.0)); 
			var weekday = new Array(7);
			weekday[0]="Sunday";
			weekday[1]="Monday";
			weekday[2]="Tuesday";
			weekday[3]="Wednesday";
			weekday[4]="Thursday";
			weekday[5]="Friday";
			weekday[6]="Saturday";
			
			svid.eVar31		=	weekday[easternDate.getDay()]; // current day
			svid.eVar32		=	easternDate.getHours() + ":" + easternDate.getMinutes(); // time
			var keywords = "WSJLive_null";
			if(data.keywords){
				if(data.keywords.length > 0){
					keywords = "WSJLive_";
					var  i;
					for (i=0;i<data.keywords.length;i = i + 1){ 
						keywords += data.keywords[i] + "|";
					}
					keywords = keywords.substr(0,keywords.length-1);
				}else{
					keywords = "WSJLive_null";
				}
			}
			
			svid.eVar67	= 	keywords;

			if(channel === false){
				svid.eVar37		=	"video embedded offsite"; 
				svid.eVar38		=	"video embedded offsite";
				svid.eVar39		=	"video embedded offsite"; 
				svid.eVar40		=	"video embedded offsite";  
				svid.eVar53		=	"video embedded offsite"; 
				svid.eVar54		= 	"video embedded offsite";
				svid.eVar25		= 	"video embedded offsite";
				svid.eVar55		= 	"video embedded offsite";
				svid.eVar61		= 	"video embedded offsite"; 
				svid.eVar68		= 	"video_emb";
				svid.eVar29		=	"video embedded offsite"; 
				if(isLive){ 
					svid.eVar69="video_live"; 
				}else{ 
					svid.eVar69="video_vod_program"; 
				}
			}else{
				svid.eVar4		=	(pageValues.pageName !== undefined)  ? pageValues.pageName : pageTitle;  // if page pagename is defined, use that.
				svid.eVar29		=	(pageValues.prop26 !== undefined)  ? pageValues.prop26 : "video embedded onsite"; 
				svid.eVar37		=	(pageValues.prop3 !== undefined)  ? pageValues.prop3 : "video embedded onsite"; 
				svid.eVar38		=	(pageValues.prop19 !== undefined)  ? pageValues.prop19 : "video embedded onsite"; 
				svid.eVar39		=	(pageValues.prop4 !== undefined)  ? pageValues.prop4 : "video embedded onsite";
				svid.eVar40		=	(pageValues.prop4 !== undefined)  ? pageValues.prop4 : "video embedded onsite";
				svid.eVar53		=	(pageValues.prop19 !== undefined)  ? pageValues.prop19 : "video embedded onsite";
				svid.eVar25		= 	(pageValues.prop2 !== undefined)  ? pageValues.prop2 : "video embedded onsite";  
				svid.eVar54		= 	(pageValues.prop2 !== undefined)  ? pageValues.prop2 : "video embedded onsite"; 
				svid.eVar55		= 	(pageValues.prop26 !== undefined)  ? pageValues.prop26 : "video embedded onsite"; 
				svid.eVar61		= 	(pageValues.prop21 !== undefined)  ? pageValues.prop21 : "video embedded onsite";
				svid.eVar68		= 	(pageValues.prop19 !== undefined)  ? "video_emb" : "video_emb";
				
				if(isLive){ 
					svid.eVar69="video_live"; 
				}else{ 
					try{
						if(data.omnitureVideoFormat){
							svid.eVar69 = data.omnitureVideoFormat;
						}else{
							if(data.doctypeID == "31" || data.doctypeID == 31){
								svid.eVar69 = "video_vod_program";	
							}else if(data.column.indexOf("clip") != -1){
								svid.eVar69 = "video_clip";	
							}else if(data.doctypeID == "471" || data.doctypeID == 471){
								svid.eVar69 = "video_sponsored";
							}else{
								svid.eVar69 = "video_vod_non-program"; 
							}
						}
					}catch(err){
						svid.eVar69 = "video_vod_non-program";	
					}
				}	
			}

			svid.eVar52		=	"Video"; // channel 
			var createdDate;
			
			if(data.omniturePublishDate){
				createdDate = data.omniturePublishDate;
			}else{
				if(data.formattedCreationDate){
					createdDate =	"video_"+data.formattedCreationDate;
				}else{
					var month = ("0" + (easternDate.getMonth() + 1)).slice(-2);
					var date = ("0" + easternDate.getDate()).slice(-2);
					createdDate = "video_"+easternDate.getFullYear()+month+date+"_"+easternDate.getHours()+":"+easternDate.getMinutes();
				}
			}
			
			svid.eVar66		= 	createdDate;
			try{
				svid.eVar70		= 	(data.column !== undefined)  ? data.column : "";
			}catch(e){}
			svid.eVar75		= 	url.split('?')[0];
			
			var trackVarsArray = svid.linkTrackVars.split(",");
			for (var i=0; i<=trackVarsArray.length; i++){
				if(trackVarsArray[i] in settings){
					svid[trackVarsArray[i]] = settings[trackVarsArray[i]];
				}
			}
		}
		
		function showRemaining() {
			var n = new Date();
			var sec = n.getTime() - start.getTime();
			now = new Date(start.valueOf() + sec); 
			var distance = end - now;
			if (distance < 0) {
				clearInterval(timer);
				document.getElementById('countdown').innerHTML = 'Loading...';
				videodata.state = "ready";
				loadWSJMediaPlayer();
				return;
			}
			var hours = Math.floor(distance / hour);
			var minutes = Math.floor((distance % hour) / minute);
			var seconds = Math.floor((distance % minute) / second);
			document.getElementById('countdown').innerHTML = "";
			if(hours > 0){
				document.getElementById('countdown').innerHTML += hours + 'hrs ';
			}
			if(minutes > 0){
				document.getElementById('countdown').innerHTML += minutes + 'mins ';
			}
			document.getElementById('countdown').innerHTML += seconds + 'secs';
		}
	
		function getThumbnail(list, w){
			var rtn = false;
			var i, len;
			for (i=0,len=list.length; i<len; i = i + 1)
			{
				rtn = list[i].url;
				if(list[i].width > w){
					return rtn;
				}
			}
			return rtn;
		}
		
		jsonReceived = function (data, textStatus, jqXHR) {
			try{
				if(data.items.length > 0 && typeof data.items[0].error == 'undefined'){
					dataLoaded = true;
					videodata = data.items[0];
					
					//videodata.videoURL = "http://hdsvod-f.akamaihd-staging.net/z/video/20131105/110513connecticut/110513connecticut_v2_ec,174,264,464,664,1264,1864,2564,k.mp4.csmil/manifest.f4m";
					
					try{
						if(externalConfig){
							videodata = $.extend(videodata, externalConfig); 
							videodata = swapAdData(videodata);
						}
					}catch(e){}
					
					if(!settings.disableDVR){
						if(videodata.disableDVR){
							settings.disableDVR = videodata.disableDVR;	
						}
					}
					

					if(settings.adsEnabled){
						adData = [];
						adData.site = "video.wsj.com";
						adData.zone = videodata.adZone;
						adData.plid = "video_articleembed"; // hardcode for now
						adData.lnid = videodata['wsj-subsection'];
						adData.guid = videodata.guid;
						if(videodata.column != null){
							var col = videodata.column;
							col = col.replace(/ /g, "_");
							col = col.replace(/'/g, '');
							col = col.toLowerCase();
							adData.column = col;
						}else{
							adData.column = "null";
						}
						adData = swapAdData(adData);
					}
				

					if(!settings.thumb){
						if(videodata.thumbnailList){
							settings.thumb = getThumbnail(videodata.thumbnailList, settings.width);	
						}else{
							settings.thumb = videodata.thumbnailURL;
						}
					}
					var ua = navigator.userAgent.toLowerCase();
					var isIpad = ua.match(/(ipad|iphone|ipod)/i);
					if(!settings.autoplay && !(isIpad || (ua.match(/(android)/i) && parseFloat(ua.slice(ua.indexOf("android")+8)) >= 4.0))){
						if(settings.thumb && !settings.noThumb){
							setupThumbnail();
						}else{
							loadWSJMediaPlayer();
						}
					}else{
						if(videodata.state == "future" && !settings.autoplay){
							setupThumbnail();
						}else{
							if(settings.loaderThumb){
								self.html('<div id="preThumb_'+videoId+'" style=" height:100%; width:100%; background-size: contain; background-repeat: no-repeat; background-position: 50% 50%;" class="vidThumb"></div>');
								$("#preThumb_"+videoId).css("background-image", 'url(' + settings.thumb +')');
							}
							loadWSJMediaPlayer();
						}
						
					}

				}else{ // no data returned
					self.append('<p style="text-align:center; color:#FFFFFF; font-size:14px;">Sorry, unable to load this video.  Try again later.</p>');
				}
			}catch(error){}
					//initHTML5();
		};
		
		function swapAdData(dat){
			if(settings){	
				if("site" in settings && settings.site != ""){
					dat.site = settings.site;
				}
				if("zone" in settings){
					dat.zone = settings.zone;
				}
				if("plid" in settings){
					dat.plid = settings.plid;
				}
				if("lnid" in settings){
					dat.lnid = settings.lnid;
				}
				if("column" in settings){
					dat.column = settings.column;
				}
				if("lnid" in dat){
					dat.lineupID = dat.lnid;
				}
				if("plid" in dat){
					dat.playerName = dat.plid;
				}
			}
			return dat;
		}
		
		function init(){
			isInIframe = (window!=window.top);
			if(!configLoaded){
				var playerConigUrl = settings.api+"player/config/"+settings.playerid+".json?callback=?";
				// $.getJSON(playerConigUrl, externalConfigLoaded).error(externalConfigError);
				$.ajax({
				  url: playerConigUrl,
				  type : 'GET',
				  async: false,
				  jsonpCallback: 'jsonCallback',
				  dataType: 'json',
				  complete: externalConfigLoaded,
				  error: externalConfigError
				});
			}else{
				if(settings.guid || (settings.type !== "" && settings.query !== "")){
					var call = "";
					var httpParam = "";
					fields = '';
					if(settings.useHttps)
						httpParam = "&https=1";
					if(settings.guid){
						call = settings.api+'find_all_videos.asp?type=guid&count=1'+httpParam+'&query='+settings.guid+'&'+fields;
					}else if(settings.type !== "" && settings.query !== ""){
						call = settings.api+'find_all_videos.asp?type='+settings.type+'&count=1'+httpParam+'&query='+settings.query+'&'+fields;
					}
					$.getJSON(call, jsonReceived).error(onJsonError);
					// $.ajax({
					//   url: call,
					//   type : 'GET',
					//   async: false,
					//   dataType: 'json',
					//   complete: jsonReceived,
					//   error: onJsonError
					// });
				}else if(settings.source){ // manual source	
					if(settings.thumb && !settings.noThumb){
						setupThumbnail();
					}else{
						loadWSJMediaPlayer();
					}	 
				}
			}

			self.trigger({type:"onInitialize"});

		}
		
		function externalConfigLoaded(data) {
			configLoaded = true;
			externalConfig = data.responseJSON;
			try{
				settings = $.extend(settings, externalConfig);
			}catch(error){}
			init();
		};
		
		function externalConfigError(e){
			configLoaded = true;
			init();
		}
		
		/////////// START //////////////
		init(); // Start the process
		////////////////////////////////
		
		// Universal tracking //
		
		function uProgress(perc, tm, cfs){
			if(!cfs){
				if(!isAdvert){
					if(perc > 0.01 && !contentStartTracked){
						contentStartTracked = true;
						contentStarted();
					}
					
					if( !trackingMilestones[0] && (perc >= 0.25)){

						trackingMilestones[0] = true;
						svid.pageName = svid.eVar10;
						svid.linkTrackEvents = svid.events = "event97";
						
						svid.pev2 = "Video_Milestone 1/4";
						svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
						
						COMSCORE.beacon({ c1:1, c2:"6035148", c3:comscoreC3, c5:"020000", c7:document.domain, c8:document.title, c10:"2-4" });
					}
					if( !trackingMilestones[1] && (perc >= 0.5)){ 
						trackingMilestones[1] = true;
						svid.linkTrackEvents = svid.events = "event98";
						svid.pageName = svid.eVar10;
						svid.pev2 = "Video_Milestone 2/4";
						svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
						COMSCORE.beacon({ c1:1, c2:"6035148", c3:comscoreC3, c5:"020000", c7:document.domain, c8:document.title, c10:"3-4" });
					}
					if( !trackingMilestones[2] && (perc >= 0.75)){
						trackingMilestones[2] = true;
						
						svid.linkTrackEvents = svid.events = "event99";
						svid.pageName = svid.eVar10;
						svid.pev2 = "Video_Milestone 3/4";
						svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
						COMSCORE.beacon({ c1:1, c2:"6035148", c3:comscoreC3, c5:"020000", c7:document.domain, c8:document.title, c10:"4-4" });
					}
					if( !trackingMilestones[3] && (perc >= 0.95)){
						trackingMilestones[3] = true;
						
						svid.linkTrackEvents = svid.events = "event100";
						svid.pageName = svid.eVar10;
						svid.pev2 = "Video_Milestone 4/4";
						svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
					}
				}
				if(Math.floor(tm / 15) > pingMilestone){
					pingMilestone = Math.floor(tm / 15);
					svid.linkTrackEvents = svid.events = 'event67';
					svid.pageName = svid.eVar10;
					svid.pev2 = "Video_Ping";
					svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
				}
				
			}

			try{
				if(isInIframe){
					if($(window.top)[0].dj.context.page.disablePageRefresh != true)
						$(window.top)[0].dj.util.Video.playVideo(settings.moduleId);
				}
			}catch(e){}
			
			self.trigger({type:"onTimeUpdate",percent:perc, time:tm});
		}
		
		playVideo = function(){

		};
		
		setupThumbnail = function(){  
			if(player){
				//swfobject.removeSWF(containerId);
				//$(this).append('<div id="'+containerId+'"><noscript>Javascript is required to view this video.  Please enable javascript.</noscript></div>');
				//self = $(this);
			}
			//self.html('<div id="thumbnail_'+videoId+'" class="vidThumb"><div class="videoHint"></div><img style="height:'+settings.height+'px; width:'+settings.width+'px;"   src="'+settings.thumb+'" /></div>');
			self.html('<div id="thumbnail_'+videoId+'" style=" height:100%; width:100%; background-size: contain; background-repeat: no-repeat; background-position: 50% 50%;" class="vidThumb"><div class="videoHint"></div></div>');
			$("#thumbnail_"+videoId).css("background-image", 'url(' + settings.thumb +')');
			$("#thumbnail_"+videoId).click(function() {
				$(this).fadeOut(300,loadWSJMediaPlayer);
				settings.autoplay = true;
			});
		};

		// Flash Events
		
		window['timeChange'+callback] = function(e, timeEvent){
			var percent = timeEvent.time / timeEvent.duration;
			if(timeEvent.duration > 0){
				uProgress(percent, timeEvent.time, timeEvent.cfs );
			}
			self.trigger('onTimeChange', timeEvent);
		};
		
		window['complete'+callback] = function (e){
			self.trigger({type:"videoComplete", guid:settings.guid});
			self.trigger({type:"onVideoComplete", guid:settings.guid});
			if(isInIframe){
				try{
					$(window.top)[0].dj.util.Video.stopVideo(settings.moduleId);
					
					//$(window.top).trigger('dj.util.Video.stopVideo',settings.moduleId);
				}catch(e){}
				
			}else{
				self.trigger('dj.util.Video.stopVideo',settings.moduleId);
			}
			if(settings.resetOnComplete){
				setupThumbnail();	
			} 

		};
		
		window['onCompanions'+callback] = function(module, ads) {
			if(typeof ads == "object"){
				ads = $.map(ads, function(value, index) {return [value];});	
			}
			self.trigger({type:"onCompanions", availableAds:ads});
		};
		
		window['requestPlaylist'+callback] = function (e){
			self.trigger('requestPlaylist');
			var json = jQuery.parseJSON(settings.playlist);
			var result = [];
			var keys = Object.keys(json);
			keys.forEach(function(key){
				result.push(json[key]);
			});
			return result[0];
		};
		window['adComplete'+callback] = function(e){
			self.trigger('adComplete');
			adComplete(e);
		};
		window['adStarted'+callback] = function(e){
			self.trigger('adStarted');
			adStarted(e);
		};
		window['adSkipped'+callback] = function(e){
			self.trigger('adSkipped');
			adSkipped(e);
		};
		window['adError'+callback] = function(e){
			self.trigger('adError');
			adError(e);
		};
		window['newVideo'+callback] = function(e, data){
			self.trigger('newVideo');
			onNewVideo(data);
		}
		window['onReplay'+callback] = function(e, data){
			self.trigger('replay');
			onReplayVideo();
		}
		window['pauseVideo'+callback] = function(e, data){
			self.trigger('pauseVideo');
		}
		window['unPauseVideo'+callback] = function(e, data){
			self.trigger('unPauseVideo');
		}
		window['onMute'+callback] = function(e, data){
			self.trigger('onMute');
		}
		window['onUnMute'+callback] = function(e, data){
			self.trigger('onUnMute');
		}

		onReplayVideo = function(){
			try{
				if(session){
					$.ajax({
					  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsChrome+"&guid={"+settings.guid+"}",
					  dataType: "jsonp"
					});
				}
			}catch(e){}	
			
			$.ajax({
			  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsId+"&guid={"+settings.guid+"}",
			  dataType: "jsonp"
			});
			skynetBeacon();
			svid.pageName = svid.eVar10;
			svid.linkTrackEvents = svid.events = "event96";
			svid.pev2 = "Video_Content Started";
			svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
			
			trackingMilestones = [false,false,false,false];
			pingMilestone = 0;
			isAdvert = false;
			initTracked = false;
			flashInitialized();
		}
		
		onNewVideo = function(videoData){ 
			trackingMilestones = [false,false,false,false];
			pingMilestone = 0;
			isAdvert = false;
			initTracked = false;
			setTrackingVars(videoData);
			try{
				if(session){
					$.ajax({
					  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsChrome+"&guid={"+settings.guid+"}",
					  dataType: "jsonp"
					});
				}
			}catch(e){}	
			$.ajax({
			  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsId+"&guid={"+settings.guid+"}",
			  dataType: "jsonp"
			});
			skynetBeacon();
			flashInitialized();
		};
		
		adComplete = function(e){
			
			svid.linkTrackEvents = svid.events = "event74";
			svid.pageName = 'WSJLive_Video_Ad';
			svid.pev2 = "Video_Ad Complete";
			svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
			isAdvert = false;
			$.ajax({
			  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsAdId+"&guid={"+settings.guid+"}",
			  dataType: "jsonp"
			});
			videoTag.play();
		};
		adStarted = function(e){
			svid.linkTrackEvents = svid.events = "event73";
			svid.pageName = 'WSJLive_Video_Ad';
			svid.pev2 = "Video_Ad Started";
			svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
			isAdvert = true;
		};
		adSkipped = function(e){
			isAdvert = false;
			$('#adContainer').hide();
		};
		adError = function(e){
			$('#adContainer').hide();
			isAdvert = false;
		};
		complete = function(e){

		};
		initialized = function(e){		
			try{
				if(session){
					$.ajax({
					  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsChrome+"&guid={"+settings.guid+"}",
					  dataType: "jsonp"
					});
				}
			}catch(e){}	
			$.ajax({
			  url: "https://video-api-secure.wsj.com/enf/wsjdn-video.asp?source="+settings.larsId+"&guid={"+settings.guid+"}",
			  dataType: "jsonp"
			});	
			skynetBeacon();
			svid.linkTrackEvents = svid.events  = "event36";
			svid.pageName = svid.eVar10;
			svid.pev2 = "Video_Start";
			svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2);
			COMSCORE.beacon({ c1:1, c2:"6035148", c3:comscoreC3, c5:"020000", c7:document.domain, c8:document.title, c10:"1-4" });
		};
		
		// FLASH ONLY EVENTS
		
		flashInitialized = function(){
			initTracked = true;
			initialized();
		};
		
		flashContentStarted = function(e){	 		

		};
		
		flashStateChange= function(e){			
		};
		
		contentStarted = function(){
			svid.pageName = svid.eVar10;
			svid.linkTrackEvents = svid.events = "event96";
			svid.pev2 = "Video_Content Started";
			svid.pe = 'lnk_o';  svid.tl(this,'o',svid.pev2); 
		};

		loadWSJMediaPlayer = function() {
			try{ 
				if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
					if ( typeof chrome.cast == "undefined") {
						$.getScript( "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js" )
						.done(function( script, textStatus ) {
							if (chrome.cast && !chrome.cast.isAvailable) {
								setTimeout(initializeCastApi, 1000);
							}
						})
					}
				}
			}catch(e){}
			
			if(videodata.state == "future"){
				var nam = (!videodata.showName) ? videodata.name : videodata.showName;
				end = new Date(now.valueOf() + (videodata.secondsUntilStartTime * 1000));
				self.prepend('<p style="color:#FFFFFF; line-height:150%; font-family:Verdana, Geneva, sans-serif; position:absolute; top:20px; text-align:center; width:'+settings.width+'px;">'+ nam + ' is scheduled to start at ' + videodata.formattedCreationDate + ' ET <br /><br />This video will play automatically in: <br /><span id="countdown"></span></p>');
				timer = setInterval(showRemaining, 1000);
			}else if(videodata.state == "processing"){
				self.prepend('<p style="color:#FFFFFF; line-height:150%; font-family:Verdana, Geneva, sans-serif; position:absolute; top:20px; text-align:center; width:'+settings.width+'px;">We are still processing your video. Please try again shortly.</p>');
			}else{
				setTrackingVars(videodata);
				if(isInIframe){
					try{
						$(window.top)[0].dj.util.Video.playVideo(settings.moduleId);
						//$(window.top).dj.util.Video.playVideo(settings.moduleId);
					}catch(e){}
				}else{
					self.trigger('dj.util.Video.playVideo',settings.moduleId);
				}
				if(detectmob()){
					settings.disableHtmlControls = true;
					initHTML5(); // load html5 player
				}else{ // attempt to load flash player
	
					var parameters = {
						autoPlay: true,
						disableSeekBarThumbnails: settings.disableSeekBarThumbnails,
						clickForSound: settings.clickForSound,
						disablePreroll: settings.disablePreroll,
						clickForSoundPreroll: settings.clickForSoundPreroll,
						//javascriptCallbackFunction: "onJavaScriptBridgeCreated",
						suppressAds:!settings.adsEnabled,
						shareenabled: settings.shareEnabled,
						callback:callback,
						adZone:settings.adZone,
						endScreenOverlay: !settings.disableEndscreen,
						disableDVR: settings.disableDVR,
						enableCaptions: settings.enableCaptions,
						chainVideos: settings.chainVideos,
						adSkippingEnabled: !settings.disableAdSkipping
						//trackingEnabled : false, // prevent flash double tracking from within the player
					}; 
					
					if(settings.adTag != "") {parameters.adTag = settings.adTag;}
					if(settings.source != "") {parameters.source = settings.source;}
					if(settings.maxBitrateIndex) {parameters.maxBitrateIndex = settings.maxBitrateIndex;}
					if(settings.site != "") {parameters.adsite = settings.site;}
					if(settings.lnid != "") {parameters.lnid = settings.lnid;}
					//if(settings.adSkippingEnabled 
					
					trackingMilestones = [false,false,false,false];
					pingMilestone = 0;
					
					var wmodeValue = "direct";
					var wmodeOptions = ["direct", "opaque", "transparent", "window"];
					if (parameters.hasOwnProperty("wmode")) {
						if (wmodeOptions.indexOf(parameters.wmode) >= 0) {
							wmodeValue = parameters.wmode;
						}
						delete parameters.wmode;
					}
					
					self.append('<div id="'+videoId+'_c" style="width:100%; height:100%;"></div>');
					
					swfobject.embedSWF(
						settings.api+"player/hds.swf"
						, videoId+'_c'
						, "100%"
						, "100%"
						, "10.2.0"
						, ""
						//, "expressInstall.swf"
						, parameters
						, {
							allowFullScreen: settings.allowFullScreen,
							allowscriptaccess: "always",
							wmode: wmodeValue,
							bgcolor: "000000" 
						}
						, {
							name: "WSJMediaPlayer"
						},swfObjectStatus
					);
				}
			}
			
		};
		
		swfObjectStatus = function(e) {
			if(!e.success){
				initHTML5();
				self.trigger({type:"onStart", playerType:"html5"});
			}else{
				self.trigger({type:"onStart", playerType:"flash"});
				player = document.getElementById(videoId+'_c');
				//player = swfobject.getObjectById(e.id);
			}
		};
		
		window['setReceiverAvailable'+callback] = function(e) { 
			try{
				launchApp();
			}catch(e){}
		};
	
		window['continueLoadVideo'+callback] = function(e) { 
			$('#preThumb_'+videoId).fadeOut(300);
		
			trackingMilestones = [false,false,false,false]; 
			pingMilestone = 0;
			flashInitialized();
			try{
				if(!settings.source){ // Not manual 
					if(!player)
						player = document.getElementById(videoId+'_c');
					var t = videodata;
					player.playVideo(videodata);
				}
			}catch(e){
				if(!player)
					player = document.getElementById(videoId+'_c');
				var t = videodata;
				player.playVideo(videodata);
			}
			try{
				if(player)
					player.setReceiverAvailable(receiverAvailable);
				//if(chromecastReceivers.length > 0)
				//	player.setReceivers(chromecastReceivers);
			}catch(e){}
			self.trigger('continueLoadVideo');
		};
		
		window['onVolumeChanged'+callback] = function(e, vol) { 
			try{
				if( session ) {
					session.setReceiverVolumeLevel(vol,
						function(e){}, // success 
						function(e){}); // error
				}
				
				var evt = jQuery.Event( "onVolumeChanged" );
				event.volume = vol;
				self.trigger(evt);

			}catch(e){}
			self.trigger('onVolumeChanged', {volume: vol});
		};
		
		externalPlayVideo = function(videodata){ // external call to play new video

			settings.autoplay = true;
			initTracked = false;
			setTrackingVars(videodata);  
			trackingMilestones = [false,false,false,false];
			pingMilestone = 0;
			$('#playlist_'+videoId).fadeOut("fast"); 

			if(player){
				flashInitialized();
				self.trigger('ready', ['Custom', 'Event']);
				player.playVideo(videodata);
			}else{
				
				//settings.adTag = 'http://pubads.g.doubleclick.net/gampad/ads?sz=400x300&iu=%2F6062%2Fiab_vast_samples&ciu_szs=300x250%2C728x90&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=[referrer_url]&correlator=[timestamp]&cust_params=iab_vast_samples%3Dlinear'; // REMOVE
				//settings.adTag = 'http://protoweb.marketwatch.com/api-video/test/vast.xml';
				//settings.adTag = 'http://ad.doubleclick.net/N2/pfadx/video.marketwatch.com/markets_video;frmt=2;plID=video_videocenter;lnID=news;ttID=C3E1E6816115434EBDD11E14B1E9587A;content=short;column=barrons_bounce;view=0;cue=mid;cgm=0;preroll=15;sz=4x4;adCat=null;dcmt=text/xml;dc_sdkv=3.0.137;u_asa=1;osd=2;ord=1400524323125';

				
				if(!settings.suppressAds){
					if(settings.adTag != ""){
						var adsRequest = {
							adTagUrl: settings.adTag,
							adType: "video"
						};
						adsLoader.requestAds(adsRequest);
					}else{
						adsLoader.requestAds(getAdTag(adData));
					}
				}
				if(!videoTag){
					initHTML5(); 
				}else{
					if(isIpad){
						videoTag.src = videodata.hls;
					}else{
						if(!videodata.video664kMP4Url){
							videoTag.src = videodata.video320kMP4Url;
						}else{
							videoTag.src = videodata.video664kMP4Url;
						}
					}
					//videoTag.src = videodata.video128kMP4Url;
					//adsInit("video","adContainer", adData);
					videoTag.play();
				}
			}
		};
		
		initHTML5 = function(){
			var ua = navigator.userAgent.toLowerCase();
			var android = ua.match(/(android)/i);	
			if(android){
				settings.adsEnabled = false;
			}
			if(settings.adsEnabled){
				try{ 
					if(typeof google.ima === 'undefined' || !imaLoaded){
						loadScript(settings.imaLibrary, function(){
							imaLoaded = true;
							initHTML5();
						});
					}
				}catch(e){
					if(!imaLoaded){
						loadScript(settings.imaLibrary, 
							function(){ // loaded
								imaLoaded = true
								initHTML5();
							},
							function(){ // failed
								imaLoaded = true;
								initHTML5();
							}
						);
					}
				}
				if(!imaLoaded){
					return;
				}
			}
			
			self.addClass("wsj-videoplayer");
			
			if(settings.autoplay && !settings.clickForSound && !settings.adsEnabled){
				autoString = 'autoplay="autoplay"';
			}else{
				autoString = '';
			}

			var ua = navigator.userAgent.toLowerCase();
			var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
			var isIpad = ua.match(/(ipad|iphone|ipod)/i);
			var canPlay =  false;
			if ( isIpad || (ua.match(/(android)/i) && parseFloat(ua.slice(ua.indexOf("android")+8)) >= 4.0)){
				settings.disableHtmlControls = true;
				canPlay = true;
			}
			
			self.parent().resize(function(e) {
				onResize();
            });
			
			window['videoFail'+callback] = function(vid){
				if(!isIpad){
					$("#"+videoId).hide();
					$("#wsjvideo-video-controls").hide();
					self.html('<p class="getFlash" >Sorry, your browser does not appear to support HTML5 video playback.<br />You will need the flash plugin installed to view this video.<br /><br /><a href="http://www.adobe.com/go/getflashplayer" target="_blank"  border="0" style="margin:0 auto;"><img style="border:none; margin:0 auto; height:auto; width:auto;" height=41 width=160 src="'+settings.api+'player/css/get-flash-player.png'+'" /></a></p>');
				}
			}
			
			onAdError = function(adErrorEvent) {
				//alert(adErrorEvent.getError());
				$('#'+videoId).trigger("onAdError");
				$('#'+videoId).trigger("isAdChanged", [false]);
				try{

				}catch(e){}
				
				if(videoTag){

				
					if(isIpad){
						videoTag.src = videodata.hls;
					}else{
						if(!videodata.video664kMP4Url){
							videoTag.src = videodata.video320kMP4Url;
						}else{
							videoTag.src = videodata.video664kMP4Url;
						}
					}
					
					try{
						videoTag.setAttribute('autoplay', true);
						videoTag.play();
					}catch(e){}
					
					if(isIpad)
						$('#'+videoId).attr('controls',true);
				}
			};
			
			onSkip = function(adEvent) {
				if(adsManager){
					adsManager.skip();
					onAdComplete(adEvent);
				}
				if(isIpad)
					$('#'+videoId).attr('controls',true);
			};
			
			onAdClicked = function(adEvent) {
				if(adsManager){
					adsManager.pause();
					//adsManager.skip();
					//onAdComplete(adEvent);
				}
				if(isIpad)
					$('#'+videoId).attr('controls',true);
			};
			
			onAdsLoaded = function(adsLoadedEvent) {

				////var adsRenderingSettings = new google.ima.AdsRenderingSettings();
				//adsRenderingSettings.loadVideoTimeout = 3;
				//adsManager = adsLoadedEvent.getAdsManager(videoTag, adsRenderingSettings); 
				adsManager = adsLoadedEvent.getAdsManager(videoTag); 

				adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdComplete);
				adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdStarted);
				adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
				adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onPauseRequested);
				adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onResumeRequested);
				adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED , onSkip);
				adsManager.addEventListener(google.ima.AdEvent.Type.CLICK , onAdClicked);
				
				adsManager.init(settings.width, settings.height - 30, google.ima.ViewMode.NORMAL); 
				//(50, 50, google.ima.ViewMode.NORMAL);
				adsManager.start();
				try {
					if(settings.autoplay){
						//adsManager.play(videoTag);
						adsManager.start();
						prerollPlayed = true;
					}
				} catch (adError) {
					//videoTag.trigger("onAdError");
				}
			};
			
			requestAd = function() {
				try{
					if(!imaLoaded)
						return;
					contentInitialized = true;
									
					if(!settings.suppressAds && !isAdvert){
	
						if(!adsContainerInit){
							adDisplayContainer = new google.ima.AdDisplayContainer(document.getElementById('adContainer'), videoTag);
							adDisplayContainer.initialize();
							
							adsLoader = new google.ima.AdsLoader(adDisplayContainer);
							
							adsLoader.addEventListener(
								google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
								onAdsLoaded,false);
							adsLoader.addEventListener(
								google.ima.AdErrorEvent.Type.AD_ERROR,
								onAdError,false);	
							
							adsContainerInit = true;
						}
						
						var adsRequest = new google.ima.AdsRequest();
						var tmStamp = new Date();
						
						//settings.adTag = 'http://pubads.g.doubleclick.net/gampad/ads?sz=400x300&iu=%2F6062%2Fiab_vast_samples&ciu_szs=300x250%2C728x90&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&correlator='+tmStamp.getTime()+'&cust_params=iab_vast_samples%3Dlinear'; // REMOVE
						//settings.adTag = 'http://protoweb.marketwatch.com/api-video/test/vast.xml?a=a';
						//settings.adTag = 'http://ad.doubleclick.net/N2/pfadx/video.marketwatch.com/markets_video;frmt=2;plID=video_videocenter;lnID=news;ttID=C3E1E6816115434EBDD11E14B1E9587A;content=short;column=barrons_bounce;view=0;cue=mid;cgm=0;preroll=15;sz=4x4;adCat=null;dcmt=text/xml;dc_sdkv=3.0.137;u_asa=1;osd=2;ord=1400524323125';
						//settings.adTag = 'http://protoweb.marketwatch.com/api-video/test/vast.xml?a=a';
						
						if(settings.adTag != ""){
							var adsRequest = {
								adTagUrl: settings.adTag,
								adType: "video"
							};
						}else{
							adsRequest = getAdTag(adData);
						}
						adsLoader.requestAds(adsRequest);
					}
				}catch(e){
					onAdError(e);
				}
			}

			onAdComplete = function(adCompleteEvent){

				
				$('#adContainer').hide();
				adComplete();

				$('#'+videoId).trigger("isAdChanged",[false]);
				$('#'+videoId).trigger("adComplete");
				
				if(isIpad){
					videoTag.src = videodata.hls;
				}else{
					if(!videodata.video664kMP4Url){
						videoTag.src = videodata.video320kMP4Url;
					}else{
						videoTag.src = videodata.video664kMP4Url;
					}
				}
				videoTag.play();
				if(isIpad)
					$('#'+videoId).attr('controls',true);
			};

			
			getAdTag = function(adData){
				var d = new Date();
				var timestamp = d.getTime(); 

				var guid = adData.guid.replace(/[^a-zA-Z 0-9]+/g,'');

				var adsRequest = {
				adTagUrl: "http://ad.doubleclick.net/pfadx/"+adData.site+"/"+adData.zone+";frmt=2;plID="+adData.plid+";lnID="+adData.lnid+";ttID="+guid+";content=short;column="+adData.column+";view=1;cue=mid;cgm=0;ord="+timestamp+";preroll=15;sz=4x4;adCat=null;dcmt=text/xml?",
					adType: "video"
				};
				return adsRequest;
			};
			
			onAdStarted = function(t) {
				try{
					var ad = t.getAd();
					var companionAdsRtn = [];
					if(ad.a.companions.length){
						for (var i = 0; i < ad.a.companions.length; i++) {
							companionAdsRtn[i] = {
								url:ad.a.companions[i].content,
								clickUrl:"",
								height:ad.a.companions[i].size.height,
								width:ad.a.companions[i].size.width,
								type:"html"
							};
						}
					}
					self.trigger({type:"onCompanions", availableAds:companionAdsRtn});
				}catch(e){
					self.trigger({type:"onCompanions", availableAds:[]});
				}
				
				$('#adContainer').show();
				adStarted();
				videoTag.removeEventListener('ended', videoComplete);
				endListener = false;
				isAdvert = true;
				$('#'+videoId).trigger("isAdChanged", [true]);
				$('#'+videoId).trigger("adStarted");
				if(isIpad)
					$('#'+videoId).attr('controls',false);
			}; 
			
			onPauseRequested = function() {
				videoTag.pause();
				
			};
			
			onResumeRequested = function() {
				videoTag.play();
				
			};
			
			onPlaying = function(){
				$('#playlist_'+videoId).hide();
				$('#adContainer').hide();
				if(!prerollPlayed && adsManager){
					adsManager.play(videoTag);
					prerollPlayed = true;
				}
				if(!initTracked){
					initTracked = true;
					initialized();	
				}
				self.trigger({type:"onPlay"});
			};
			
			onPlay = function(){
				$('#playlist_'+videoId).hide();
				$('#adContainer').hide();
			};
			
			onError = function(evt){
				var ua = window.navigator.userAgent.toLowerCase();
				var isIpad = ua.match(/(ipad|iphone|ipod)/i);
				var myNav = navigator.userAgent.toLowerCase();
  				var isIe = (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
				if((!isIpad && !canPlay) || isIe != false){
					$("#"+videoId).hide();
					$("#wsjvideo-video-controls").hide();
					self.html('<p class="getFlash">Sorry, your browser does not appear to support HTML5 video playback.<br />You will need the flash plugin installed to view this video.<br /><br /><a href="http://www.adobe.com/go/getflashplayer" target="_blank"  border="0" style="margin:0 auto;"><img style="border:none; margin:0 auto; height:auto; width:auto;" height=41 width=160 src="'+settings.api+'player/css/get-flash-player.png'+'" /></a></p>');
				}
			};
			
			onPlayerExitFullscreen = function(){
				try{
				var ua = window.navigator.userAgent.toLowerCase();
				var isIphone = ua.match(/(iphone)/i);
				if(isIphone){
					$('#thumbnail_'+videoId).show();
				}
				}catch(e){}
			};
			
			onPause = function(){
				self.trigger({type:"onPause"});
			};
			
			videoProgress = function(evt){
				var p = evt.target.currentTime / evt.target.duration;
				if(p > 0.01 && !endListener && !isAdvert && evt.target.duration > 0){
					videoTag.addEventListener('ended', videoComplete);
					endListener = true;
				}
				uProgress(p, evt.target.currentTime, false);
			};
			
			videoComplete = function(){
				if(isInIframe){
					try{
						//$(window.top)[0].dj.util.Video.playVideo(settings.moduleId);
						$(window.top)[0].dj.util.Video.stopVideo(settings.moduleId);
					}catch(e){}
					
				}else{
					self.trigger('dj.util.Video.stopVideo',settings.moduleId);
				}
				if(!isAdvert && !settings.disableEndscreen){ 
					generateEndscreen();	
				}
				
				self.trigger({type:"videoComplete", guid:settings.guid});
				self.trigger({type:"onComplete", guid:settings.guid});
			};
			
			window['liveEnded'+callback] = function(vid){
				videoComplete();
			}
			
			if(!is_firefox){
				if(videodata.state == "live"){
					self.html('<div class="playlist" id="playlist_'+videoId+'"></div><video id="'+videoId+'" poster="'+settings.thumb+'" width="'+settings.width+'" height="'+settings.height+'" '+autoString+' controls onerror="liveEnded'+callback+'(this)" ><source src="'+videodata.hls+'" type="video/mp4"><p>Sorry, your browser does not appear to support Http Live Streaming playback.</p></video>');
					//$("#"+videoId).play();
				}else{
					if(isIpad){
						self.html('<div id="thumbnail_'+videoId+'" style="height:100%; width:100%; background-size: contain; background-repeat: no-repeat; background-position: 50% 50%;" class="vidThumb"><div class="videoHint"></div></div><video style="-webkit-transform-style: preserve-3d; display:none;" id="'+videoId+'" width="100%" height="100%" '+autoString+' controls onerror="videoFail'+callback+'(this)" onclick=""><source src="'+videodata.hls+'" type="application/x-mpegURL"></source><source src="'+videodata.video664kMP4Url+'" type="video/mp4""></source><p class="getFlash">Sorry, your browser does not appear to support HTML5 video playback.</p></video><div id="adContainer"></div>');
						$("#thumbnail_"+videoId).css("background-image", 'url(' + settings.thumb +')');
						$("#thumbnail_"+videoId).click(function(evt) {
							$(this).css("z-index", 0);
							$(this).hide();
							$('#'+videoId).show();
							videoTag = document.getElementById(videoId);
							videoTag.play();
						});
					}else{
						//alert(canPlay);
						self.html('<div  class="playlist" id="playlist_'+videoId+'"></div><video id="'+videoId+'" width="100%" height="100%" '+autoString+' controls poster="'+settings.thumb+'"><p class="getFlash">Sorry, your browser does not appear to support HTML5 video playback.<br />You will need the flash plugin installed to view this video.<br /><br /><a href="http://www.adobe.com/go/getflashplayer" target="_blank"  border="0" style="margin:0 auto;"><img style="border:none; margin:0 auto;  height:auto; width:auto;" height=41 width=160 src="'+settings.api+'player/css/get-flash-player.png'+'" /></a></p></video><div id="adContainer"></div>');
						//self.html('<div id="playlist"></div><video style="-webkit-transform-style: preserve-3d" id="'+videoId+'" width="'+settings.width+'" height="'+parseInt(parseFloat(settings.height) - 0).toString()+'" '+autoString+' controls poster="'+settings.thumb+'"><p class="getFlash" style="background-color:#000000; margin: 0 auto; color:#FFFFFF !important; width:'+settings.width+'px; font-family:arial; top:0%; height:100%; position:relative; text-align:center;">Sorry, your browser does not appear to support HTML5 video playback.<br />You will need the flash plugin installed to view this video.<br /><br /><a href="http://www.adobe.com/go/getflashplayer" target="_blank"  border="0" style="margin:0 auto;"><img style="border:none; margin:0 auto;" height=41 width=160 src="'+settings.api+'player/css/get-flash-player.png'+'" /></a></p></video>');
					}
					videoTag = document.getElementById(videoId);
					
					//videoTag.setAttribute('src', videodata.video664kMP4Url);
					//videoTag.load();	

					try{
						canPlay =  videoTag.canPlayType('video/mp4; codecs="avc1.42E01E"');
					}catch(ignore){}
				}

				if(!settings.disableHtmlControls && $.fn.wVideo != 'undefined' && canPlay != false){
					//htmlControlsInstance = $("#"+videoId).wVideo()[0]; // SET HTML5 Style
					if(settings.autoplay){
						//videoTag.play();
					}
				}
				
				if(isIpad){
					$("#"+videoId).bind("loadedmetadata", function(){
						$("#"+videoId).unbind("loadedmetadata");
						requestAd();
					});
				}else{
					requestAd();
				}
			}

			if(!canPlay || is_firefox){ // if firefox or cannot play, display message.
				$("#"+videoId).hide();
				self.append('<p class="getFlash" >Sorry, your browser does not appear to support HTML5 video playback.<br />You will need the flash plugin installed to view this video.<br /><br /><a href="http://www.adobe.com/go/getflashplayer" target="_blank"  border="0" style="margin:0 auto;"><img style="border:none; margin:0 auto; height:auto; width:auto;" height=41 width=160 src="'+settings.api+'player/css/get-flash-player.png'+'" /></a></p>');
			}else{
				if(isIpad){
					videoTag.src = videodata.hls;
				}else{
					if(!videodata.video664kMP4Url){
						videoTag.src = videodata.video320kMP4Url;
					}else{
						videoTag.src = videodata.video664kMP4Url;
					}
				}
				
				/// LISTENERS /////
				videoTag.addEventListener('ended', videoComplete);
				videoTag.addEventListener('loadedmetadata', onloadedmetadata);
				
				videoTag.addEventListener('timeupdate', videoProgress);
				videoTag.addEventListener('playing', onPlaying); 
				videoTag.addEventListener('play', onPlay); 
				videoTag.addEventListener('error', onError); 
				videoTag.addEventListener('pause', onPause); 
				videoTag.addEventListener('webkitendfullscreen', onPlayerExitFullscreen, false);
			}
			
			/*
			generateEndscreen = function() { 
				//var numThumbs = 9;
				//var ratio = settings.width / settings.height;
				//if(ratio > 1.8)
				var numThumbs = 30;
				var exStyle = "";
				if(self.width() < 300){
					numThumbs = 1;
					exStyle = " small"
				}
				var httpParam = "";
				if(settings.useHttps)
					httpParam = "&https=1";
				//if(ratio > 2.6)
					//numThumbs = 3;
					
				if(settings.skynetEnable){
					//http://skynet-service-prod.elasticbeanstalk.com/v1/users/user/anonymous/3302ab9e-4590-11e3-b19b-0ec29b759f23/recommendations
					$.getJSON(settings.skynetRecServer + "/v1/users/" + settings.userUri+settings.guid + "/recommendations?top="+numThumbs, onSkyNet);		
				}else{
					$.getJSON(settings.api+'find_all_videos.asp?count='+numThumbs+httpParam+'&type=wsj-section&query=news&fields='+fields, onRecommendations);
				}
				
				function onSkyNet(data){
					var guidStr = data.toString()
					$.getJSON(settings.api+'find_all_videos.asp?type=guid'+httpParam+'&query='+guidStr+'&'+fields, onRecommendations);		
				}
				
				function onRecommendations(data) {	
					var videos = data.items;
					playlist = videos;
					var chain = true;
					var thumbshtml = '<div id="main-wrap"><div class="endScreen" id="endScreen"><ul class="endScreen-items">';
					$.each(videos, function(key, val) {
						thumbshtml += '<li data-thumb="' + val.videoStillURL + '" class="fixed" id="video_' + key + '">';
						thumbshtml += '<div class="hover-content vcenter">';
						thumbshtml += '<div>';
						thumbshtml += '<p class="endscreen-title" >'+val.name+'</p>';
						//if(key != 0 && key != 1)
						//	thumbshtml += '<button rel="' + key + '">Play</button>';
						thumbshtml += '</div>';
						thumbshtml += '</div>';
						
						if(key == 0)
							thumbshtml += '<div class="footer replay"></div>';
							
						if(key == 1 && chain == true)	
							thumbshtml += '<div id="timer" class="footer">Up next in 10 seconds</div>';
						
						thumbshtml += '</li>';
					});
					thumbshtml += '</div></div></ul>';
					//$('#playlist').css("height", settings.height);
					//$('#playlist').css("width", settings.width);
					$('#playlist').empty();
					$('#playlist').append(thumbshtml);
					
					$("#playlist").endScreen({
						maxItemHeight: 160,
						delay: 300,
						onHoverExclude: "item",
						breakpoints: "2600,1200,800,640,480",
						countX_2600: 5,
						countY_2600: 3,
						countX_1200: 5,
						countY_1200: 4,
						countX_800: 3,
						countY_800: 3,
						countX_640: 2,
						countY_640: 2,
						countX_480: false
					});
					
					//$('.endscreenThumb').click(playVideoFromEndScreen);
					
					$('#playlist').fadeIn("slow");
				}

			};
			
			*/
			generateEndscreen = function() { 
				//var numThumbs = 9;
				//var ratio = settings.width / settings.height;
				//if(ratio > 1.8)
				var numThumbs = 6;
				var exStyle = "";
				if(self.width() < 300){
					numThumbs = 1;
					exStyle = " small"
				}
				var httpParam = "";
				if(settings.useHttps)
					httpParam = "&https=1";
				//if(ratio > 2.6)
					//numThumbs = 3;
					
				if(settings.skynetEnable){
					//http://skynet-service-prod.elasticbeanstalk.com/v1/users/user/anonymous/3302ab9e-4590-11e3-b19b-0ec29b759f23/recommendations
					$.getJSON(settings.skynetRecServer + "/v1/users/" + settings.userUri+settings.guid + "/recommendations?top="+numThumbs, onSkyNet);		
				}else{
					$.getJSON(settings.api+'find_all_videos.asp?count='+numThumbs+httpParam+'&type=wsj-section&query=news&fields='+fields, onRecommendations);
				}
				
				function onSkyNet(data){
					var guidStr = data.toString()
					$.getJSON(settings.api+'find_all_videos.asp?type=guid'+httpParam+'&query='+guidStr+'&'+fields, onRecommendations);		
				}
				
				function onRecommendations(data) {	
					var videos = data.items;
					playlist = videos;
					
					var thumbshtml = '<ul class="thumb-grid group">';
					$.each(videos, function(key, val) {
						thumbshtml += '<li class="video-archive'+exStyle+'" id="video_' + key + '">';
						thumbshtml += '<a class="endscreenThumb" rel="' + key + '">';
						thumbshtml += '<div class="playlistDescription"><div>'+val.name+'</div></div>';
						thumbshtml += '<img src=\"' + val.videoStillURL + '\" alt="' + val.name + '" /></a>';
						thumbshtml += "</li>";
					});
					thumbshtml += '</ul>';
					//$('#playlist').css("height", settings.height);
					//$('#playlist').css("width", settings.width);
					$('#playlist_'+videoId).empty();
					$('#playlist_'+videoId).append(thumbshtml);
					$('.endscreenThumb').click(playVideoFromEndScreen);
					
					$('#playlist_'+videoId).fadeIn("slow");
				}

			};
			
			playVideoFromEndScreen = function(){ // HTML 5 endscreen
			
				settings.autoplay = true;
				initTracked = false;
				var thumbId = $(this).attr("rel"); 
				videodata = playlist[thumbId];
				videodata = swapAdData(videodata);
				try{
					if(externalConfig)
						settings = $.extend(videodata, externalConfig); 
				}catch(e){}
				setTrackingVars(videodata);  
				trackingMilestones = [false,false,false,false];
				pingMilestone = 0;
				$('#playlist_'+videoId).fadeOut("fast"); 

				if(!videoTag){
					initHTML5(); 
				}else{
					if(isIpad){
						videoTag.src = videodata.hls;
					}else{
						videoTag.src = videodata.video664kMP4Url;
					}
					//videoTag.src = videodata.video128kMP4Url;
					videoTag.play();
				}
				if(!settings.suppressAds){
					requestAd();
				}
			};
		};
    	return this.each(function() {

        });
    }
});

if(typeof console === "undefined") { var console = { log: function (logMsg) { } }; }

function getUrlVars() {
	'use strict';
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		if(value === 'true'){
			value = true;	
		}else if(value === 'false'){
			value = false; 	
		}
        vars[key] = value;
    });
    return vars;
}

if ( !Date.prototype.toISOString ) {
  ( function() {

    function pad(number) {
      var r = String(number);
      if ( r.length === 1 ) {
        r = '0' + r;
      }
      return r;
    }

    Date.prototype.toISOString = function() {
      return this.getUTCFullYear()
        + '-' + pad( this.getUTCMonth() + 1 )
        + '-' + pad( this.getUTCDate() )
        + 'T' + pad( this.getUTCHours() )
        + ':' + pad( this.getUTCMinutes() )
        + ':' + pad( this.getUTCSeconds() )
        + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )


        + 'Z';
    };

  }() );
}

var s_account="djglobal,djwsj"; 
try{
	var url = (window.location != window.parent.location) ? document.referrer: document.location.href;
	if (url.indexOf("wsj.com") !== -1) { 
		s_account = "djglobal,djwsj";
	}
	if(url.indexOf('live.wsj.com')!== -1) {
		s_account = "djglobal,djwsjlive";
	}
	if(url.indexOf("cwsj.com") !== -1) {
		s_account = "djglobal,djwsjchina";
	}
	if(url.indexOf("cn.wsj.com") !== -1){
		s_account = "djglobal,djwsjchina";
	}
	if(url.indexOf("jwsj.com") !== -1) { 
		s_account = "djglobal,djjapanwsj";
	}
	if (url.indexOf("kr.wsj.com") !== -1) { 
		s_account = "djglobal,djwsjkorea";
	}
	if (url.indexOf("indo.wsj.com") !== -1) { 
		s_account = "djglobal,djwsjindonesia";
	}
	if (url.indexOf("marketwatch.com") !== -1) { 
		s_account = "djglobal,djmarketwatch";
	}
	if (url.indexOf("barrons.com") !== -1) { 
		s_account = "djglobal,djbarrons";
	}
	if (url.indexOf("wsj.de") !== -1) { 
		s_account = "djglobal,djwsjgermany";
	}
	if(url.indexOf('allthingsd.com')!== -1){
		s_account = "djglobal,djatd";
	}
	if(url.indexOf('wsj.com.tr')!== -1){
		s_account = "djglobal,djwsjturkey";
	}
	if(url.indexOf('efinancialnews.com')!== -1){
		s_account = "djglobal,djefinancialnews";
	}
}catch(e){
	s_account = "djglobal,djwsjlive";
}

function getDomain(domain){
	"use strict";
	if(domain.indexOf("cwsj.com") !== -1) {
		return "WSJ China";
	}
	if(domain.indexOf("cn.wsj.com") !== -1){
		return "WSJ China";
	}
	if (domain.indexOf("jwsj.com") !== -1) { 
		return "WSJ Japan";
	} 
	if (domain.indexOf("kr.wsj.com") !== -1) { 
		return "WSJ Korea";
	}
	if (domain.indexOf("indo.wsj.com") !== -1) { 
		return "WSJ Indonesia";
	}
	if (domain.indexOf("wsj.com") !== -1) { 
		return "WSJ";
	}
	if (domain.indexOf("marketwatch.com") !== -1) { 
		return "MarketWatch";
	}
	if (domain.indexOf("barrons.com") !== -1) { 
		return "Barrons Online";
	}
	if (domain.indexOf("wsj.de") !== -1) { 
		return "WSJ Germany";
	}
	if(domain.indexOf('allthingsd.com')!== -1){
		return "AllThingsD";
	}
	if(domain.indexOf('smartmoney.com')!== -1){
		return "SmartMoney";
	}
	if(domain.indexOf('fxtrader')!== -1) {
		return "DJFXTrader";
	}
	if(domain.indexOf('fins.com')!== -1) {
		return "FINS";
	}
	return false;
}

function loadScript(url, callback, errorCallback){

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
		script.onerror = function(){
           errorCallback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

// MOBILE DETECTION //
function detectmob() { 
	"use strict";
 	if( navigator.userAgent.match(/Android/i)
		|| navigator.userAgent.match(/webOS/i)
		|| navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i)
		|| navigator.userAgent.match(/BlackBerry/i)
		|| navigator.userAgent.match(/Windows Phone/i)
 	){
    return true;
  }
  return false;
}

/*
$( document ).ready(function() {
	try{jQuery.easing["jswing"]=jQuery.easing["swing"];jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(e,t,n,r,i){return jQuery.easing[jQuery.easing.def](e,t,n,r,i)},easeInQuad:function(e,t,n,r,i){return r*(t/=i)*t+n},easeOutQuad:function(e,t,n,r,i){return-r*(t/=i)*(t-2)+n},easeInOutQuad:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t+n;return-r/2*(--t*(t-2)-1)+n},easeInCubic:function(e,t,n,r,i){return r*(t/=i)*t*t+n},easeOutCubic:function(e,t,n,r,i){return r*((t=t/i-1)*t*t+1)+n},easeInOutCubic:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t*t+n;return r/2*((t-=2)*t*t+2)+n},easeInQuart:function(e,t,n,r,i){return r*(t/=i)*t*t*t+n},easeOutQuart:function(e,t,n,r,i){return-r*((t=t/i-1)*t*t*t-1)+n},easeInOutQuart:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t*t*t+n;return-r/2*((t-=2)*t*t*t-2)+n},easeInQuint:function(e,t,n,r,i){return r*(t/=i)*t*t*t*t+n},easeOutQuint:function(e,t,n,r,i){return r*((t=t/i-1)*t*t*t*t+1)+n},easeInOutQuint:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t*t*t*t+n;return r/2*((t-=2)*t*t*t*t+2)+n},easeInSine:function(e,t,n,r,i){return-r*Math.cos(t/i*(Math.PI/2))+r+n},easeOutSine:function(e,t,n,r,i){return r*Math.sin(t/i*(Math.PI/2))+n},easeInOutSine:function(e,t,n,r,i){return-r/2*(Math.cos(Math.PI*t/i)-1)+n},easeInExpo:function(e,t,n,r,i){return t==0?n:r*Math.pow(2,10*(t/i-1))+n},easeOutExpo:function(e,t,n,r,i){return t==i?n+r:r*(-Math.pow(2,-10*t/i)+1)+n},easeInOutExpo:function(e,t,n,r,i){if(t==0)return n;if(t==i)return n+r;if((t/=i/2)<1)return r/2*Math.pow(2,10*(t-1))+n;return r/2*(-Math.pow(2,-10*--t)+2)+n},easeInCirc:function(e,t,n,r,i){return-r*(Math.sqrt(1-(t/=i)*t)-1)+n},easeOutCirc:function(e,t,n,r,i){return r*Math.sqrt(1-(t=t/i-1)*t)+n},easeInOutCirc:function(e,t,n,r,i){if((t/=i/2)<1)return-r/2*(Math.sqrt(1-t*t)-1)+n;return r/2*(Math.sqrt(1-(t-=2)*t)+1)+n},easeInElastic:function(e,t,n,r,i){var s=1.70158;var o=0;var u=r;if(t==0)return n;if((t/=i)==1)return n+r;if(!o)o=i*.3;if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.asin(r/u);return-(u*Math.pow(2,10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o))+n},easeOutElastic:function(e,t,n,r,i){var s=1.70158;var o=0;var u=r;if(t==0)return n;if((t/=i)==1)return n+r;if(!o)o=i*.3;if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.asin(r/u);return u*Math.pow(2,-10*t)*Math.sin((t*i-s)*2*Math.PI/o)+r+n},easeInOutElastic:function(e,t,n,r,i){var s=1.70158;var o=0;var u=r;if(t==0)return n;if((t/=i/2)==2)return n+r;if(!o)o=i*.3*1.5;if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.asin(r/u);if(t<1)return-.5*u*Math.pow(2,10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o)+n;return u*Math.pow(2,-10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o)*.5+r+n},easeInBack:function(e,t,n,r,i,s){if(s==undefined)s=1.70158;return r*(t/=i)*t*((s+1)*t-s)+n},easeOutBack:function(e,t,n,r,i,s){if(s==undefined)s=1.70158;return r*((t=t/i-1)*t*((s+1)*t+s)+1)+n},easeInOutBack:function(e,t,n,r,i,s){if(s==undefined)s=1.70158;if((t/=i/2)<1)return r/2*t*t*(((s*=1.525)+1)*t-s)+n;return r/2*((t-=2)*t*(((s*=1.525)+1)*t+s)+2)+n},easeInBounce:function(e,t,n,r,i){return r-jQuery.easing.easeOutBounce(e,i-t,0,r,i)+n},easeOutBounce:function(e,t,n,r,i){if((t/=i)<1/2.75){return r*7.5625*t*t+n}else if(t<2/2.75){return r*(7.5625*(t-=1.5/2.75)*t+.75)+n}else if(t<2.5/2.75){return r*(7.5625*(t-=2.25/2.75)*t+.9375)+n}else{return r*(7.5625*(t-=2.625/2.75)*t+.984375)+n}},easeInOutBounce:function(e,t,n,r,i){if(t<i/2)return jQuery.easing.easeInBounce(e,t*2,0,r,i)*.5+n;return jQuery.easing.easeOutBounce(e,t*2-i,0,r,i)*.5+r*.5+n}});(function(){function i(e,t,n,r,i,s,o,u){if(i<u*n)return jQuery.easing[e](r,i,s,n*o,n*u);return jQuery.easing[t](r,i-n*u,s+n*o,(1-n)*o,(1-n)*u)}var e,t,n,r=jQuery;e=["Cubic-Back","Cubic-Bounce-0.85","Cubic-Elastic-0.66","Back-Elastic-0.66"];for(var t in e){t=e[t].split("-");n={};n["easeIn"+t[0]+"Out"+t[1]]=function(e,t,n){return function(r,s,o,u,a){return i("easeIn"+e,"easeOut"+t,n||.5,r,s,o,u,a)}}(t[0],t[1],t[2]);r.extend(r.easing,n)}})();(function(e,t,n,r){"use strict";function i(e){this.init(e)}function s(t){this.elem=e(t)}function o(e){var t=this;t.base=e}function u(e){var t=this;t.base=e}var a=n,f=t,l=e(a),c=e(f),h="endScreen",p="endScreen";var d=function(){return t.requestAnimationFrame||t.webkitRequestAnimationFrame||t.mozRequestAnimationFrame||t.msRequestAnimationFrame||t.oRequestAnimationFrame||function(e){return t.setTimeout(e,1e3/60)}}(),v=function(){return t.cancelAnimationFrame||t.webkitCancelAnimationFrame||t.mozCancelAnimationFrame||t.msCancelAnimationFrame||t.oCancelAnimationFrame||function(e){t.clearTimeout(e)}}(),m=function(){return function(t){function n(){r=o(null,Math.max(0,i),t.from,t.to-t.from,s);if(t.callback)t.callback(r,t.callbackParams,i,s);if(t.change)t.change(r,t.callbackParams,i,s);if(i==s){if(t.complete)t.complete()}else{t.context[t.id]=d(function(){n()})}i=Math.min(s,i+1e3/60)}var r=t.from,i=-t.delay||0,s=!t.duration?1e3:t.duration,o;o=e.easing&&e.easing[t.easing]?e.easing[t.easing]:g.swing;if(t.context[t.id])v(t.context[t.id]);n()}}(),g={swing:function(e,t,n,r,i){return-r*(t/=i)*(t-2)+n}},y=function(){var e=t.getComputedStyle(n.documentElement,""),r=(Array.prototype.slice.call(e).join("").match(/-(moz|webkit|ms)-/)||e.OLink===""&&["","o"])[1],i="WebKit|Moz|MS|O".match(new RegExp("("+r+")","i"))[1];return{dom:i,lowercase:r,css:"-"+r+"-",js:r[0].toUpperCase()+r.substr(1)}}(),b=function(){var i,s;i=n.createElement("p");i.style["transform"]="matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";n.body.insertBefore(i,n.body.lastChild);s=t.getComputedStyle(i).getPropertyValue("transform");e(i).remove();if(s!==r){return s!=="none"}else{return false}}(),w=function(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}();i.prototype={init:function(e){var t=this;t.elem=e;return t},update:function(){var e=this,t=[],n;t.push("translate3d("+e.x()+"px, "+e.y()+"px, "+e.z()+"px)");t.push("rotateX("+e.rotX()+"deg)");t.push("rotateY("+e.rotY()+"deg)");t.push("rotateZ("+e.rotZ()+"deg)");t.push("scale("+e.scale()+")");n={};n[y.css+"transform"]=t.join(" ");n[y.css+"transform-origin"]=e.originX()*100+"% "+e.originY()*100+"%";n["opacity"]=e.opacity();e.elem.css(n);return e},animate:function(t,n,r){var i=this;t=t.split(",");for(var s in t){r=e.extend(true,{},r);r.id=t[s]+"Tween";r.context=i;r.from=i[t[s]]();r.to=n;r.callback=function(e){return function(n){i[t[e]](n);i.update()}}(s);m(r)}return i},stop:function(e){var t=this;e=e.split(",");for(var n in e){v(t[e[n]+"Tween"])}return t},set:function(e,t){var n=this;e=e.split(",");for(var r in e){n[e[r]](t)}return n},x:function(e){var t=this;if(e===r)return t._x||0;t._x=e;return t},y:function(e){var t=this;if(e===r)return t._y||0;t._y=e;return t},z:function(e){var t=this;if(e===r)return t._z||0;t._z=e;return t},rotX:function(e){var t=this;if(e===r)return t._rx||0;t._rx=e;return t},rotY:function(e){var t=this;if(e===r)return t._ry||0;t._ry=e;return t},rotZ:function(e){var t=this;if(e===r)return t._rz||0;t._rz=e;return t},origin:function(e){var t=this;t.originX(e).originY(e);return t},originX:function(e){var t=this;if(e===r)return t._ogx===r?.5:t._ogx;t._ogx=e;return t},originY:function(e){var t=this;if(e===r)return t._ogy===r?.5:t._ogy;t._ogy=e;return t},opacity:function(e){var t=this;if(e===r)return t._op===r?1:t._op;t._op=e;return t},scale:function(e){var t=this;if(e===r)return t._sc===r?1:t._sc;t._sc=e;return t}};var E={items:"."+p+"-items",item:"."+p+"-item",itemWrap:"."+p+"-item-wrap",thumb:"."+p+"-item-thumb"};s.prototype={init:function(t,n){var r=this;if(r.api(t,n))return r;r.options=e.extend(true,{},e.fn[h].options,r.elem.data(),t);r.setup();r.update();r.manager=new o(r);r.manager.start();return r},destroy:function(){var e=this,t,n;e.destroyed=true;e.manager.stop();delete e.manager;n=e.items.length;for(t=0;t<n;t++){e.items[t].destroy();delete e.items[t]}e.elem.data("_"+h+"Instance",null);return e},setup:function(){var e=this,t,n,r;e.items=[];e.domItems=e.elem.find(E.items).children();n=e.domItems.length;for(r=0;r<n;r++){t=new u(e);t.init(e.domItems[r]);e.items.push(t)}return e},getCountResponsive:function(){var e=this,t=e.elem.outerWidth(),n,i,s,o;i=e.options.breakpoints?e.options.breakpoints.split(","):[];s=i.length;n={};for(o=0;o<s;o++){if(t<=i[o]&&e.options["countX_"+i[o]]!==r){n.x=e.options["countX_"+i[o]]}if(t<=i[o]&&e.options["countY_"+i[o]]!==r){n.y=e.options["countY_"+i[o]]}}return n},update:function(){var e=this,t=e.elem.width(),n=e.elem.height(),r,i,s,o,u,a,f,l,c;if(e.destroyed)return;r=e.getCountResponsive();if(r.x){e.xCount=r.x}else if(e.options.countX){e.xCount=e.options.countX}else{i=Math.floor(t/e.options.maxItemWidth);s=Math.ceil(t/e.options.maxItemWidth);e.xCount=t/i>e.options.maxItemWidth?s:i;e.xCount=Math.max(e.options.minCountX||1,e.xCount);if(e.options.maxCountX)e.xCount=Math.min(e.options.maxCountX,e.xCount)}if(r.y){e.yCount=r.y}else if(e.options.countY){e.yCount=e.options.countY}else{o=Math.floor(n/e.options.maxItemHeight);u=Math.ceil(n/e.options.maxItemHeight);e.yCount=n/o>e.options.maxItemHeight?u:o;e.yCount=Math.max(e.options.minCountY||1,e.yCount);if(e.options.maxCountY)e.yCount=Math.min(e.options.maxCountY,e.yCount)}e.itemWidth=Math.ceil(t/e.xCount);e.itemHeight=Math.ceil(n/e.yCount);e.domItems.hide().css("z-index",0);e.elem.css("overflow",e.overflow);e.grid=[];e.rows=[];e.columns=[];l=e.xCount*e.yCount;for(c=0;c<l;c++){a=c%e.xCount;f=Math.floor(c/e.xCount);if(e.items[c]){e.items[c].reset().setPos(a,f).loadThumb().elem.css({width:e.itemWidth,height:e.itemHeight}).show();e.grid.push(e.items[c]);if(!e.rows[f])e.rows[f]=[];e.rows[f].push(e.items[c]);if(!e.columns[a])e.columns[a]=[];e.columns[a].push(e.items[c])}}return e},getItem:function(e,t,n,r,i){var s=this,o,u,a,f,l,c,h,p,d,v;if(s.items.length<=s.grid.length)return;if(s.destroyed)return;c=s.items[e];h=s.items[t];c.reset();h.reset();c.elem.css("z-index",9999);h.elem.css("z-index",9999);d=n.slice(0,1)=="-"?-1:1;p=n.slice(n.length-1);switch(i){case"easeInBackOutElastic":u=.33*r;a=.66*r;f="easeInBack";l="easeOutElastic";break;case"easeInBackOutCubic":u=.33*r;a=.66*r;f="easeInBack";l="easeOutCubic";break;case"easeInCubicOutElastic":u=.33*r;a=.66*r;f="easeInCubic";l="easeOutElastic";break;case"easeInBackOutBack":u=.5*r;a=u;f="easeInBack";l="easeOutBack";break;case"easeInCubicOutCubic":u=.5*r;a=u;f="easeInCubic";l="easeOutCubic";break;case"easeInCubicOutBounce":u=.5*r;a=u;f="easeInCubic";l="easeOutBounce";break;default:u=.5*r;a=u;f=l=i}switch(n){case"rollInX":case"rollInY":case"-rollInX":case"-rollInY":s.swapItems(t,e);h.elem.css("z-index",0);h.setPos(c.px,c.py).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();c.css3d["origin"+p](d>0?1:0).animate("opacity",.5,{duration:u,easing:f}).animate("rot"+(p=="Y"?"X":"Y"),-d*(p=="Y"?1:-1)*(-90-180*Math.atan(.5*(p=="Y"?s.itemHeight:s.itemWidth)/s.options.perspective)/Math.PI),{duration:u,easing:f,complete:function(){h.css3d.opacity(.5)["origin"+p](d>0?0:1)["rot"+(p=="Y"?"X":"Y")](-d*(p=="Y"?1:-1)*(90+180*Math.atan(.5*(p=="Y"?s.itemHeight:s.itemWidth)/s.options.perspective)/Math.PI)).update().animate("opacity",1,{duration:a,easing:l}).animate("rot"+(p=="Y"?"X":"Y"),0,{duration:a,easing:l,complete:function(){s.update();c.reset()}})}});h.css3d.opacity(.5)["origin"+p](d>0?0:1)["rot"+(p=="Y"?"X":"Y")](-d*(p=="Y"?1:-1)*(90+180*Math.atan(.5*(p=="Y"?s.itemHeight:s.itemWidth)/s.options.perspective)/Math.PI)).update();break;case"rollOutX":case"rollOutY":case"-rollOutX":case"-rollOutY":s.swapItems(t,e);var m=e+d*(p=="Y"?s.xCount:1);if(m>=0&&(p=="Y"||m%s.xCount!=s.xCount-(d>0?0:1)&&m%s.xCount!=(d>0?0:-1)))s.swapItems(t,m);h.elem.css("z-index",0);var g=false;if(n=="-rollOutY"&&c.py==0||n=="rollOutY"&&c.py==s.yCount-1||n=="-rollOutX"&&c.px==0||n=="rollOutX"&&c.px==s.xCount-1){g=true}h.setPos(c.px,c.py).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();c.css3d["origin"+p](d>0?1:0).animate("opacity",.5,{duration:u,easing:f}).animate("rot"+(p=="Y"?"X":"Y"),d*(p=="Y"?1:-1)*(-90+180*Math.atan(.5*(p=="Y"?s.itemHeight:s.itemWidth)/s.options.perspective)/Math.PI),{duration:u,easing:f,complete:function(){if(!g){c.setPos(h.px+(p=="Y"?0:d),h.py+(p=="Y"?d:0)).css3d["origin"+p](d>0?0:1)["rot"+(p=="Y"?"X":"Y")](d*(p=="Y"?1:-1)*(90-180*Math.atan(.5*(p=="Y"?s.itemHeight:s.itemWidth)/s.options.perspective)/Math.PI)).update().animate("opacity",g?0:1,{duration:a,easing:l}).animate("rot"+(p=="Y"?"X":"Y"),0,{duration:a,easing:l,complete:function(){s.update();s.items[t].reset()}})}else{s.update();s.items[t].reset()}}});break;case"slideX":case"slideY":case"-slideX":case"-slideY":p=p.toLowerCase();s.swapItems(t,e);c.elem.css("overflow","hidden");h.elem.css("overflow","hidden");c.css3d.animate(p,-d*(p=="x"?s.itemWidth:s.itemHeight),{duration:u,easing:f,complete:function(){s.update();c.reset()}});h.setPos(c.px,c.py).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();h.css3d[p](d*(p=="x"?s.itemWidth:s.itemHeight)).update().animate(p,0,{duration:a,easing:l});break;case"flipX":case"flipY":case"-flipX":case"-flipY":s.swapItems(t,e);c.css3d.animate("rot"+p,-d*90,{duration:u,easing:f,complete:function(){h.setPos(c.px,c.py).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();h.css3d["rot"+p](d*90).opacity(.5).update().animate("opacity",1,{duration:a,easing:l}).animate("rot"+p,0,{duration:a,easing:l,complete:function(){s.update();c.reset()}})}});break;case"slideRow":case"-slideRow":p="x";o=c.py;e=s.getIndex(d>0?s.xCount-1:0,o);c=s.items[e];s.swapItems(t,e);for(v=0;v<s.xCount-1;v++){s.swapItems(s.getIndex(d>0?s.xCount-1-v:v,o),s.getIndex(d>0?s.xCount-2-v:v+1,o))}s.overflow=s.elem.css("overflow");s.elem.css("overflow","hidden");s.items[d>0?s.getIndex(0,o):s.getIndex(s.xCount-1,o)].setPos(d>0?0:s.xCount-1,o).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();s.items[d>0?s.getIndex(0,o):s.getIndex(s.xCount-1,o)].css3d.x(-d*s.itemWidth).update().animate("x",0,{duration:r,easing:i,change:function(e){for(v=d>0?1:0;v<s.xCount-(d>0?0:1);v++){s.rows[o][v].css3d.x(d*s.itemWidth+e).update()}c.css3d.x(d*s.itemWidth+e).update()},complete:function(){s.update();c.reset()}});break;case"slideColumn":case"-slideColumn":p="y";o=c.px;e=s.getIndex(o,d>0?s.yCount-1:0);c=s.items[e];s.swapItems(t,e);for(v=0;v<s.yCount-1;v++){s.swapItems(s.getIndex(o,d>0?s.yCount-1-v:v),s.getIndex(o,d>0?s.yCount-2-v:v+1))}s.overflow=s.elem.css("overflow");s.elem.css("overflow","hidden");s.items[d>0?s.getIndex(o,0):s.getIndex(o,s.yCount-1)].setPos(o,d>0?0:s.yCount-1).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();s.items[d>0?s.getIndex(o,0):s.getIndex(o,s.yCount-1)].css3d.y(-d*s.itemHeight).update().animate("y",0,{duration:r,easing:i,change:function(e){for(v=d>0?1:0;v<s.yCount-(d>0?0:1);v++){s.columns[o][v].css3d.y(d*s.itemHeight+e).update()}c.css3d.y(d*s.itemHeight+e).update()},complete:function(){s.update();c.reset()}});break;case"fade":default:s.swapItems(t,e);c.elem.css("z-index",0);h.setPos(c.px,c.py).loadThumb().elem.css({width:s.itemWidth,height:s.itemHeight}).show();h.css3d.opacity(0).update().animate("opacity",1,{duration:r,easing:i,complete:function(){s.update();c.reset()}});break}return s},getIndex:function(e,t){var n=this;return t*n.xCount+e},swapItems:function(e,t){var n=this,r,i,s;s=n.grid.length;r=n.items[e];i=n.items[t];n.items[e]=i;n.items[t]=r;if(e<s){n.grid[e]=i;n.rows[Math.floor(e/n.xCount)][e%n.xCount]=i;n.columns[e%n.xCount][Math.floor(e/n.xCount)]=i}if(t<s){n.grid[t]=r;n.rows[Math.floor(t/n.xCount)][t%n.xCount]=r;n.columns[t%n.xCount][Math.floor(t/n.xCount)]=r}return n},api:function(t,n){var r=this;if(typeof t==="string"){switch(t){case"update":r.update();break;case"start":r.manager.start();break;case"stop":r.manager.stop();break;case"show":r.manager.getItem(n[0],n[1],n[2],n[3],n[4]);break;case"option":var i={};i[n[0]]=n[1];r.options=e.extend(true,{},r.options,i);r.update();break;case"destroy":r.destroy();break}return true}return false}};o.prototype={start:function(e){var t=this;m({id:"timer",context:t,from:0,to:1,duration:e||t.base.options.delay||1,complete:function(){if(t.destroyed)return;t.getItem();t.start(t.animationDuration+t.base.options.delay)}});return t},stop:function(){var e=this;v(e.timer);return e},pause:function(){var e=this;e.paused=true;return e},resume:function(){var e=this;e.paused=false;return e},getItem:function(e,t,n,i,s){var o=this,u,a,f,l,c,h;if(o.paused)return;if(e===r||e===false)e=Math.floor(Math.random()*o.base.grid.length);if(t===r||t===false)t=Math.floor(Math.random()*(o.base.items.length-o.base.grid.length))+o.base.grid.length;if(e>o.base.grid.length-1)e-=o.base.grid.length-1;u=(o.base.options.animations||"rollInX,rollInY,rollOutX,rollOutY,slideX,slideY,flipX,flipY,slideRow,slideColumn,fade,-rollInX,-rollInY,-rollOutX,-rollOutY,-slideX,-slideY,-flipX,-flipY,-slideRow,-slideColumn,-fade").split(",");a=o.base.options.animationsExcluded?o.base.options.animationsExcluded.split(","):[];h=a.length;for(c=0;c<h;c++){u.splice(u.indexOf(a[c]),1)}n=n||u[Math.floor(Math.random()*u.length)];if(!b&&["rollInX","rollInY","rollOutX","rollOutY","flipX","flipY"].indexOf(n.replace("-",""))){n="fade"}if(o.base.options.onHoverExclude=="item"&&o.base.items[e].elem.hasClass("hover")||o.base.items[e].elem.hasClass(o.base.options.fixedClass)){return o.getItem(e+1,t,n,i,s)}else if(["rollOutX","slideRow","-rollOutX","-slideRow"].indexOf(n)!=-1){l=o.base.items[e].py;h=o.base.rows[l].length;for(c=0;c<h;c++){if(o.base.options.onHoverExclude=="item"&&o.base.rows[l][c].elem.hasClass("hover")||o.base.rows[l][c].elem.hasClass(o.base.options.fixedClass)){return o.getItem(e+o.base.xCount,t,n,i,s)}}}else if(["rollOutY","slideColumn","-rollOutY","-slideColumn"].indexOf(n)!=-1){f=o.base.items[e].px;h=o.base.columns[f].length;for(c=0;c<h;c++){if(o.base.options.onHoverExclude=="item"&&o.base.columns[f][c].elem.hasClass("hover")||o.base.columns[f][c].elem.hasClass(o.base.options.fixedClass)){return o.getItem(e+1,t,n,i,s)}}}o.base.getItem(e,t,n,i||o.base.options[n.replace("-","")+"Duration"]||o.base.options.duration,s||o.base.options[n.replace("-","")+"Easing"]||o.base.options.easing);o.animationDuration=i||o.base.options[n.replace("-","")+"Duration"]||o.base.options.duration;return o}};u.prototype={init:function(t){var n=this;n.elem=e(t);n.elem.wrapInner(e("<div/>").addClass(E.itemWrap.slice(1)));n.content=n.elem.children().eq(0);n.elem.css(y.css+"perspective",n.base.options.perspective);n.css3d=new i(n.content);n.elem.on("mouseenter",{t:n},n.handleMouseOver);n.elem.on("mouseleave",{t:n},n.handleMouseOut);n.elem.on("touchend",{t:n},n.handleTouchEnd);return n},handleMouseOver:function(e){var t=e.data.t;t.elem.addClass("hover").siblings().removeClass("hover");if(t.base.options.onHoverExclude=="all")t.base.manager.pause()},handleMouseOut:function(e){var t=e.data.t;t.elem.removeClass("hover");if(t.base.options.onHoverExclude=="all")t.base.manager.resume()},handleTouchEnd:function(e){var t=e.data.t;if(!t.elem.hasClass("hover")){e.preventDefault();t.handleMouseOver(e);return false}},loadThumb:function(){var t=this,n=t.elem.data("thumb"),r=new Image;if(t.thumbLoaded||!n)return t;t.elem.addClass("loading");t.thumbLoaded=true;r.onload=function(){t.content.append(e("<div/>").addClass(E.thumb.slice(1)).css({"background-image":"url("+n+")","background-position":"center center","background-repeat":"no-repeat","background-size":t.base.options.sizing}).fadeTo(0,0).fadeTo(300,1));t.elem.removeClass("loading")};r.src=n;return t},setPos:function(e,t){var n=this;n.px=e;n.py=t;n.elem.css({left:n.px*n.base.itemWidth,top:n.py*n.base.itemHeight});return n},reset:function(){var e=this;e.elem.css({"z-index":0,overflow:"visible"});e.css3d.stop("x,y,z,rotX,rotY,rotZ,opacity").set("x,y,z,rotX,rotY,rotZ",0).opacity(1).origin(.5).update();return e},destroy:function(){var e=this;e.reset();e.elem.off("mouseenter",e.handleMouseOver);e.elem.off("mouseleave",e.handleMouseOut);e.elem.empty().removeClass("hover").removeAttr("style");return e}};e.extend(e.fn,{endScreen:function(t){var n=Array.prototype.slice.call(arguments,1);return e(this).each(function(){var r=e(this).data("_"+h+"Instance");if(typeof t==="string"&&!r)return;r=r||new s(this);r.init(t,n);e(this).data("_"+h+"Instance",r)})}});e.fn[h].options={animations:false,animationsExcluded:false,delay:500,maxItemWidth:240,maxItemHeight:160,countX:false,countY:false,minCountX:1,minCountY:1,maxCountX:false,maxCountY:false,onHoverExclude:false,sizing:"cover",fixedClass:"fixed",perspective:600,duration:650,easing:"easeInOutCubic",rollInXDuration:false,rollInXEasing:"easeInCubicOutCubic",rollInYDuration:false,rollInYEasing:"easeInCubicOutCubic",rollOutXDuration:false,rollOutXEasing:"easeInCubicOutCubic",rollOutYDuration:false,rollOutYEasing:"easeInCubicOutCubic",flipXDuration:false,flipXEasing:"easeInCubicOutCubic",flipYDuration:false,flipYEasing:"easeInCubicOutCubic",slideXDuration:false,slideXEasing:false,slideYDuration:false,slideYEasing:false,slideRowDuration:false,slideRowEasing:false,slideColumnDuration:false,slideColumnEasing:false,fadeDuration:false,fadeEasing:false,breakpoints:false}})(jQuery,window,document)
	}catch(e){}
});


(function($,h,c){var a=$([]),e=$.resize=$.extend($.resize,{}),i,k="setTimeout",j="resize",d=j+"-special-event",b="delay",f="throttleWindow";e[b]=250;e[f]=true;$.event.special[j]={setup:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.add(l);$.data(this,d,{w:l.width(),h:l.height()});if(a.length===1){g()}},teardown:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.not(l);l.removeData(d);if(!a.length){clearTimeout(i)}},add:function(l){if(!e[f]&&this[k]){return false}var n;function m(s,o,p){var q=$(this),r=$.data(this,d);r.w=o!==c?o:q.width();r.h=p!==c?p:q.height();n.apply(this,arguments)}if($.isFunction(l)){n=l;return m}else{n=l.handler;l.handler=m}}};function g(){i=h[k](function(){a.each(function(){var n=$(this),m=n.width(),l=n.height(),o=$.data(this,d);if(m!==o.w||l!==o.h){n.trigger(j,[o.w=m,o.h=l])}});g()},e[b])}})(jQuery,this);
*/