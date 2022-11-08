/* Author: 

*/

/*jslint white: false, debug: false, devel: true, onevar: false, plusplus: false, browser: true, bitwise: false, maxerr: 200 */
/*global jQuery: false, $: false, log: false, window: false, WSJNG: false, _: false */

// Just in case there's a //console.log hanging around.... neutralize it on weak browsers
if (!window.console) { window.console = { "log": function() {} }; }

// Overall
var myData;
var myQString;
var myLang;

// Life inside
var map;
var startingCenter; //US: (41,-99)

// Social
var url;

// skrollr
var s;

// social
var tweettext;

// interval handle
var intervalHandle = [];

(function(){

	$(document).ready(function(){
		loadShareTools();

		/*$(selector).on('click', function(){
			// this will pass a name/title to Omniture so you can track click counts on button, tabs, links etc.
			window.countClicks(title);
		});*/

        $.Suction({duration:750});


        //buildMedia("chart","chart_1",dataobject.densitychart,null,$('#demoChart'),false);

        trackPage('load');

		myQString=$.bbq.getState();

        // Load parallax TODO: this breaks scrollign on ios
        //s = skrollr.init();
	        
        // Load querystring data
        myLang = "en";
        if(getParameterByName('lang').length>0){
            myLang=getParameterByName('lang');
        }

        loadJson();


        $('#sideContentClose').click(function() {
            $('#sideContent').addClass('nodisplay');
            $('#sideContentInner').empty();


            $(window).resize();
        });

        cacheMedia();

        // Hide pace from old browsers
        if(!Modernizr.csstransforms3d) {
            $('.pace').css('display','none');
        }

        $('body').on('click', 'img', function() {
            $(this).parent().children('.captionCreditContainer').toggle();
        });


        $('body').on('click', '.captionCreditContainer', function() {
            $(this).toggle();
        });


        // Side content scrolling
        //if ($("body").height() > $(window).height()) {
            var top;
            $('#sideContent').mouseenter(function() {
                top = $(window).scrollTop();
                //$('body').addClass('noscroll').css({top: -top + 'px'});
            }).mouseleave(function() {
                //$('body').removeClass('noscroll');
                //$(window).scrollTop(top);
            });
        //}

	});

    function cacheMedia() {
        //if(!(deviceType==="tablet" || deviceType==="phone")) {            
            setTimeout(function() {
                $.getJSON("getData.php?f=grabMedia&mobile=true", function(jsonData) {
                    for(var i in jsonData) {
                        ////console.log("loading: " + jsonData[i]);
                        new Image().src = jsonData[i];
                    }
                });

            }, 2000);
        /*} else {
            setTimeout(function() {
                $.getJSON("getData.php?f=grabMedia&mobile=true", function(jsonData) {
                    for(var i in jsonData) {
                        //console.log("loading: " + jsonData[i]);
                        new Image().src = jsonData[i];
                    }
                });

            }, 2000);
        }*/
    }

    function changeHash(chapterId){
        var state = {};
        state[ "chapter" ] = chapterId;
        $.bbq.pushState( state );
        myQString=$.bbq.getState();
    }

    function trackPage(name2var){
        
        var proj_id = "KWC0303";
        var proj_headline = "Kowloon Walled City";
        var trackingOpts;
        if(name2var){
            trackingOpts = {    
                pageName_over:"WSJ_infogrfx_interactive_"+proj_id+"_"+proj_headline+"_"+name2var
            };
        }else{
            trackingOpts = {    
                pageName_over:"WSJ_infogrfx_interactive_"+proj_id+"_"+proj_headline
            };
        }   
        // Turn off tracking by including ?tracking=0 in the URL
        // If tracking is not set or is not equal to 0, project will track.
        if (tracking != 0) {
            //UNCOMMENT IF YOU WANT TO TRACK THE PAGE LOAD 
            // window.countPage(proj_id, proj_headline, "", trackingOpts); 
        } 
    }

	function loadJson(mySlug){
        initialize();
    }

    function initialize() {
        // Build chapter
        $.getJSON("getData.php?f=fetchChapters", function(jsonData) {
            for (var i in jsonData) {
                var html = '<div id="chap_' + jsonData[i].id + '" data-chap="' + jsonData[i].id + '" class="button chapter">';
                html += '<div class="chap-number">' + jsonData[i].number + '<span class="hide">.</span></div>';
                html += '<div class="chap-text">' + eval('jsonData[i].title.' + myLang)  + '</div>';
                html += '</div>';
                html += '<div class="social button"></div>'

                ////console.log(html);
                $('#chapters').append(html);

                
                $('#landscapeWarning').html()
            }

            $('.chapter').click(function() {
                ////console.log("load chapter at .chapter");
                loadChapter($(this).data('chap'));
            });

            $('.icon-WSJ').click(function() {
                loadChapter('intro');
            });

            if(myQString.chapter){
                ////console.log("load chapter at myQString");
                loadChapter(myQString.chapter);
            } else {
                ////console.log("load chapter at myQString default");
                loadChapter("intro");
            }
        });

        // Build static data
        $.getJSON("getData.php?f=fetchStaticData", function(jsonData) {
            $('#landscapeWarning').html(eval('jsonData.rotate.' + myLang));
            tweettext = eval('jsonData.tweettext.' + myLang);
        });
        
        /*
        $('.chapter').click(function() {
            loadChapter($(this).data('chap'));
        });

        if(myQString.chapter){
            loadChapter(myQString.chapter);
        } else {
            loadChapter("intro");
        } */
    }

    function fixSideContent() {
        $('#sideContent').css('margin-top',$('#sectionContainer .hed').outerHeight());
        $('#sideContent').css('height',$(window).height()-$('.controls').height()-$('#sectionContainer .hed').outerHeight());

        if($('#internalSideContent').length>0) {
            ////console.log('calculating internal side content');
            var newHeight = $(window).height()-$('#internalSideContent').offset().top-$('.controls').height();
            if(newHeight!=0)
                $('#internalSideContent').css('height',newHeight);
        }

    }

    function fixMainContent() {
        // Track the top of the content 
        $('#mainContent').css('padding-top',$('#sectionContent').position().top+$('#sectionContent').outerHeight(true));
        //$(window).resize(function() {
        //    $('#mainContent').css('padding-top',$('#sectionContent').position().top+$('#sectionContent').outerHeight(true));
        //});
    }

    function resetEverything() {
        // Reset window events
        $(window).off("resize");
        $(window).off("scroll");

        // Figure out the right size for the side content
        

        // window resize
        $(window).resize(function() {
            fixSideContent();
            fixMainContent();
            //console.log("fix side content");
            ////alert($(window).width() * $(window).height());
        });

        // remove chapter class from main content
        $('#mainContent').removeClass();
        $('body').css('top', '');;

        // Stop audio
        $('.audio').each(function() {
            $(this).stop();
        });

        // Clear full size interactive
        $('#interactive_wrapper').removeClass('full');

        // Clear timer handles
        //console.log("Clearing " + intervalHandle.length + " handles");
        for(var i in intervalHandle) {
            clearInterval(intervalHandle[i]);
        }
        intervalHandle = [];

        // hides the sidebar
        $('#sideContent').addClass('nodisplay');

        // Reset page
        $('#sideContentInner').empty();
        $('#sectionContainer').empty();
        $('#mainContent').empty().removeClass().css('padding-top',0);
    }

    function addSpacing() {
        // pad the main window at the bottom;
        //$('#mainContent').css('padding-bottom',$('.controls').height());
        //$('#mainContent').css('padding-top',$('#sectionContent').position().top+$('#sectionContent').outerHeight(true));
        $('.downArrow').css('bottom',$('.controls').height());
        
        $(window).resize(function() {
            //$('#mainContent').css('padding-bottom',$('.controls').height());
            //$('#mainContent').css('padding-top',$('#sectionContent').position().top+$('#sectionContent').outerHeight(true));
            $('.downArrow').css('bottom',$('.controls').height());
        });
    }

    function updateShare() {
        // Count where we are
        
        url = window.location.href;

        //console.log("Pre url: " + url);
        
        // Convert to bit.ly
        $.ajax({
            url: 'http://api.bitly.com/v3/shorten',
            async: false,
            data: {
                longUrl: url,
                apiKey: 'R_4dd2ea29f00a2b806151d12d7807286b',
                login: 'wsjblogs'
            },
            dataType: 'jsonp',
            success: function(data) {
                if (data.status_code === 200) {
                    url = encodeURIComponent(data.data.url);
                }
            }
        }); 
    }

    function loadChapter(chapterId) {
        trackPage("chap_" + chapterId);
        changeHash(chapterId);
        updateShare();
        //console.log("Switching to: " + chapterId);

        // Reset timers and other bits here
        resetEverything();

        // Add chapter
        $('#mainContent').addClass('chap_'+chapterId);

        // TODO: Adapt this to pull back only a portion of the data
        $.getJSON("getData.php?f=grabChapter&chapter=" + chapterId, function(jsonData) {
                myData = jsonData;
                //console.log(myData);

                if(chapterId=="intro") {
                    $('.controls').css({'opacity':0});
                    buildIntro();
                } else {
                    $('.controls').animate({'opacity':1},1000);
                    buildSectionHead(chapterId);
                    addSpacing();
                    
                    if(chapterId=="life") {
                        buildLifeInside();
                    } else if(chapterId=="history") {
                        buildHistory();
                    } else if(chapterId=="people") {
                        buildPeople();
                    } else if(chapterId=="pop") {
                        buildPop();
                    } else if(chapterId=="legacy") {
                        buildLegacy();
                    } else {
                        buildIntro();
                    }



                    fixMainContent();

                    $('.chapter').removeClass('selected');
                    $('#chap_'+chapterId+'.chapter').addClass('selected');
                }

                //$('.downArrow').delay(500).animate({'opacity':0.3},500).delay(500).animate({'opacity':1},500).delay(500).animate({'opacity':0.3},500).delay(500).animate({'opacity':1},500).delay(500).animate({'opacity':0},1000).delay(1000).addClass('nodisplay');

                //if(!($('#interactive_wrapper')).visible()) {

                setTimeout(function (){

                     if($('body').hasScrollBar()) {

                            $('.downArrow').css('display','inline-block');
                            // main content too big, so let's display the helper arrow
                            $('.downArrow').pulse({
                                opacity: [1,0] // pulse between 1 and 0
                            }, 1000, 100);

                            // and kill it when they scroll
                            $(window).scroll(function() {
                                $('.downArrow').remove();
                            });
                        } else {
                            $('.downArrow').css('display','none');
                        }

                 }, 1500); // how long do you want the delay to be? 

                
                // Rebuild skrollr
                //s.refresh();
        }); 
        
        

        /*else if(pageNumber==3) {
            
        } else if(pageNumber==4) {
            
        } else if(pageNumber==5) {
            
        }*/
    }

    function buildSectionHead(chapterId) {
        // clear contents
        $('#sectionContent').empty();

        var element = myData.section;

        var html = '<div id="sectionContainer">';

        if(eval('element.hed.' + myLang).length>0) {
            html += '<div class="hed" style="color:' + element.color + '"><div class="textInner">' + eval('element.hed.' + myLang) + '</div></div>';
            html += '<div class="hedpad"></div>';
        }

        if(eval('element.shorthed.' + myLang).length>0) {
            html += '<div class="shorthed" style="color:' + element.color + '"><div class="textInner">' + eval('element.shorthed.' + myLang) + '</div></div>';
            html += '<div class="shorthedpad"></div>';
        }
        //html += '<div class="hed" style="color:black">' + element.hed + '</div>';

        if(eval('element.dek.' + myLang).length>0)
            html += '<div class="dek">' + eval('element.dek.' + myLang) + '</div>';

        // Build social
        if(myLang==="cn") {
            html+= '<div class="social">';
            html+= '<a title="Weibo" class="si-sinaweibo">Weibo</a>';            
            html+= '<a title="Comments" class="si-comments">Comments</a>';
            html+= '</div>';
        } else {
            html+= '<div class="social">';
            html+= '<a title="Facebook" class="si-facebook">Facebook</a>';
            html+= '<a title="Google" class="si-google">Google</a>';
            html+= '<a title="Twitter" class="si-twitter">Twitter</a>';
            html+= '<a title="LinkedIn" class="si-linkedin">LinkedIn</a>';
            html+= '<a title="Comments" class="si-comments">Comments</a>';
            html+= '</div>';
        }
        

        if(element.options.length>0) {
            html += '<div id="sectionOptionContainer"></div>'; 
            html += '<div id="sectionOptionExplainerContainer" class="hide"></div>'; 
            //html += '<div id="sectionDescription">' + element.description + '</div>';
            html += '</div>';
        }

        $('#sectionContent').html(html);



        if(typeof element.seconddek!=='undefined') {
            $('#sectionContainer').append('<div class="seconddek bold">' + eval('element.seconddek.' + myLang) + '</div>');
        }

        // Connect social action
        $('.social a').click(function() {

            var twitterUrl = 'http://twitter.com/intent/tweet?url='+url + '&text=' + encodeURIComponent(tweettext);
            //window.open(twitterUrl);

            if($(this).hasClass('si-facebook')) {
                window.open('http://www.facebook.com/sharer/sharer.php?u='+url, '_blank', 'status=1,height=436,width=626,resizable=0');
            } else if($(this).hasClass('si-google')) {
                window.open('http://plus.google.com/share?&url='+url, '_blank', 'status=1,height=436,width=626,resizable=0');
            } else if($(this).hasClass('si-twitter')) {
                window.open(twitterUrl, '_blank', 'status=1,height=436,width=626,resizable=0');
            } else if($(this).hasClass('si-linkedin')) {
                window.open('http://www.linkedin.com/shareArticle?mini=true&url='+url, '_blank', 'status=1,height=436,width=626,resizable=0');
            } else if($(this).hasClass('si-weibo')) {
                window.open('http://service.weibo.com/share/share.php?url='+url, '_blank', 'status=1,height=436,width=626,resizable=0');
            } else if($(this).hasClass('si-comments')) {
                window.open('http://blogs.wsj.com/scene/2014/04/01/city-of-imagination-kowloon-walled-city/', '_blank', '');
            }
        })

        // Add options now
        for (var i in element.options) {
            $('#sectionOptionContainer').append('<div id="option_' + i + '" data-option="' + element.options[i].id + '" class="option">' + eval('element.options[i].name.' + myLang) + '</div>');

            // TODO: probably need to move this somewhere else?
            if(typeof element.options[i].type!==undefined) {
                if(element.options[i].type==="video") {
                    $('#option_' + i).magnificPopup({
                      items: {
                          src: '<div id="section-popup"></div>',
                          type: 'inline'
                      },
                      closeBtnInside: true,
                      callbacks: {
                            open: function() {
                                buildMedia('video','sectionVideo_' + i, element.options[i].contents, "", $("#section-popup"), true);

                                $("#section-popup").append('<button title="Close (Esc)" type="button" class="mfp-close">×</button>');
                            }
                        }
                    });
                }
            }
        }

        // Add option explainers 
        for (var i in element.options) {
            if(typeof element.options[i].explainer!=='undefined')
                $('#sectionOptionExplainerContainer').append('<div data-option="' + element.options[i].id + '" class="option_explainer">' + eval('element.options[i].explainer.' + myLang) + '</div>');
        }

    }

    function buildIntro() {

        $('#mainContent').html('<div id="cycler"></div><div id="audio" class="play"></div>')
        $('#interactive_wrapper').addClass('full');

        // construct fader
        for(var i in myData.images) {
            var active = "", lazy = "", style = "";
            if(i == 0) { 
                active = "cycleractive";
            }

            if(i != 0) { lazy = "lazy"; }

            $('#cycler').append('<div ' + style + ' class="cyclerimage ' + lazy + ' ' + active + '" data-original="' + myData.images[i].url + '"></div>');


        }

        $('.cycleractive').css('background-image','url(' + $('.cycleractive').data('original') + ')');

        $('.cyclerimage').click(function() {
            $('#splash_text').animate({'opacity':0},1000);
            $('.controls').animate({'opacity':1},1000);
        });

        $(".lazy").lazyload();


        // construct splash
        var html = '<div id="splash_text" style="opacity: 1;">';
        //html += '<div class="hed">Kowloon Walled City</div>';
        html += '<div class="hed">';
        html += eval('myData.title.' + myLang);
        html += '</div>';
        html += '<div class="dek">';
        html += eval('myData.splash.' + myLang);
        html += '</div>';
        html += '<div id="splash_continue" class="splash_continue" style="opacity: 1;">' + eval('myData.continue.' + myLang); + '</div>'
        html += '</div>';

        $('#mainContent').append(html);


        $('#splash_continue').click(function() {
            loadChapter("people");
        });


        $('#mainContent img').css({'position':'absolute', 'z-index':1});
        $('#mainContent img').each(function() {
            $(this).addClass('fullScreen');
        })

        var duration=4000; //milliseconds each stays onscreen
        var transition=Math.round(duration/2);


        intervalHandle.push(setInterval(function() { cycleImages("#cycler",transition) }, duration));

        // add audio
        buildMedia('audio','introAudio', myData.audio, "", $("#audio"), true);


        if(deviceType==="phone" || deviceType==="tablet") {
            $('#audio').removeClass('play').addClass('mute');
            //$(this).find('audio')[0].pause();
        } 

        $('#audio').click(function() {
            trackPage("intro_mute");
            if($(this).hasClass('mute')) {
                // already muted, so play audio
                $(this).find('audio')[0].play();
                $(this).removeClass('mute').addClass('play');
            } else {
                // playing, so let's pause
                $(this).find('audio')[0].pause();
                $(this).removeClass('play').addClass('mute');
            }
        });
    }

    function buildLifeInside() {

        /*
        var sideHtml = '<div id="sideContentHed">';
        sideHtml += '<div class="hed">' + myData.section.sidebar + '</div>';
        sideHtml += '</div>';

        // 13 myData.content.people.elements[13].
        //sideHtml += 

        //console.log(sideHtml);

        $('#sideContentInner').html(sideHtml); */

        // Build KWC
        $('#sideContent').removeClass('nodisplay').addClass('hide');
        $(window).resize();
        buildMedia('chart', 'lifeIntroChart', myData.section.chart, null, $('#sideContentInner'), false)

        $('#mainContent').html('<div id="map"></div><div id="legend" class="hide"></div>');

        // Build content
        // Build Take a Walk (the video)
        // Build video path
        var polyLine = [];
        var videoPath = myData.video.path;
        for(var i in videoPath.nodes) {
            polyLine.push([parseInt(videoPath.nodes[i].lat), parseInt(videoPath.nodes[i].lng)]);
        }

        var videoPolyline = new L.Polyline(polyLine, {
            color: videoPath.options.color, //#F16521',
            weight: videoPath.options.weight,
            opacity: videoPath.options.opacity,
            smoothFactor: videoPath.options.smoothFactor
        });

        var videoLayer = [];
        videoLayer.push(videoPolyline);

        // Now add the markers
        var videoMarkers = myData.video.markers;
        var videoMarker = L.icon({
            iconUrl: videoMarkers.options.iconUrl,
            iconSize: [parseInt(videoMarkers.options.iconSize.width), parseInt(videoMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(videoMarkers.options.iconAnchor.x), parseInt(videoMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(videoMarkers.options.popupAnchor.x), parseInt(videoMarkers.options.popupAnchor.y)]
        });

        for(var i in videoMarkers.nodes) {
            var videoSubset = videoMarkers.nodes[i];
            var marker = L.marker([videoSubset.lat, videoSubset.lng], {icon: videoMarker, data: videoSubset}).bindPopup(eval('videoSubset.popupText.' + myLang));
            marker.on('click', function(e) {
                //console.log("video marker click");
                handleMarkerClick($(this)[0].options.data);

                // TODO: Do something different with the video here?
                //$('#sideContentInner').empty();
            }).on('mouseover', marker.openPopup.bind(marker)).openPopup();
            videoLayer.push(marker);
        }

        // Convert to a leaflet layer
        videoLayer = L.layerGroup(videoLayer);


        // Build the keylocations map
        var keyLayer = [];
        // polyline??

        var keyMarkers = myData.video.keylocations;
        var keyMarker = L.icon({
            iconUrl: keyMarkers.options.iconUrl,
            iconSize: [parseInt(keyMarkers.options.iconSize.width), parseInt(keyMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(keyMarkers.options.iconAnchor.x), parseInt(keyMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(keyMarkers.options.popupAnchor.x), parseInt(keyMarkers.options.popupAnchor.y)]
        });

        for(var i in keyMarkers.nodes) {
            var keySubset = keyMarkers.nodes[i];
            ////console.log(keySubset);
            var marker = L.marker([keySubset.lat, keySubset.lng], {icon: keyMarker, data: keySubset}).bindPopup(eval('keySubset.popupText.' + myLang));
            marker.on('click', function(e) {
                //console.log("key marker click");
                handleMarkerClick($(this)[0].options.data);
                //$('#sideContentInner').empty();
            }).on('mouseover', marker.openPopup.bind(marker)).openPopup();
            keyLayer.push(marker);
        }

        // Convert to a leaflet layer
        keyLayer = L.layerGroup(keyLayer);

        // Build video path
        /*polyLine = [];
        var vicePath = myData.vice.path;
        for(var i in vicePath.nodes) {
            polyLine.push([parseInt(vicePath.nodes[i].lat), parseInt(vicePath.nodes[i].lng)]);
        }

        var vicePolyline = new L.Polyline(polyLine, {
            color: vicePath.options.color, //#F16521',
            weight: vicePath.options.weight,
            opacity: vicePath.options.opacity,
            smoothFactor: vicePath.options.smoothFactor
        }); */

        var viceLayer = [];
        //viceLayer.push(vicePolyline);
        // polyline??

        var viceMarkers = myData.vice.markers;
        var viceMarker = L.icon({
            iconUrl: viceMarkers.options.iconUrl,
            iconSize: [parseInt(viceMarkers.options.iconSize.width), parseInt(viceMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(viceMarkers.options.iconAnchor.x), parseInt(viceMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(viceMarkers.options.popupAnchor.x), parseInt(viceMarkers.options.popupAnchor.y)]
        });

        for(var i in viceMarkers.nodes) {
            var viceSubset = viceMarkers.nodes[i];
            var marker = L.marker([viceSubset.lat, viceSubset.lng], {icon: viceMarker, data: viceSubset}).bindPopup(eval('viceSubset.popupText.' + myLang));
            marker.on('click', function(e) {
                //console.log("vice marker click");
                handleMarkerClick($(this)[0].options.data);
                //$('#sideContentInner').empty();
            }).on('mouseover', marker.openPopup.bind(marker)).openPopup();
            viceLayer.push(marker);
        }

        // Convert to a leaflet layer
        viceLayer = L.layerGroup(viceLayer);

        // Build the how it worked
        var workLayer = [];
        // polyline??

        var workMarkers = myData.work.markers;
        var workMarker = L.icon({
            iconUrl: workMarkers.options.iconUrl,
            iconSize: [parseInt(workMarkers.options.iconSize.width), parseInt(workMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(workMarkers.options.iconAnchor.x), parseInt(workMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(workMarkers.options.popupAnchor.x), parseInt(workMarkers.options.popupAnchor.y)]
        });

        for(var i in workMarkers.nodes) {
            var workSubset = workMarkers.nodes[i];
            var marker = L.marker([workSubset.lat, workSubset.lng], {icon: workMarker, data: workSubset}).bindPopup(eval('workSubset.popupText.' + myLang));
            marker.on('click', function(e) {
                //console.log("work marker click");
                handleMarkerClick($(this)[0].options.data);
                map.removeLayer(fullWaterLayer);
                map.removeLayer(otherMainentryLayer);
                map.removeLayer(staircaseentryLayer);
                //$('#sideContent').animate({'right':'0'});
                //$('#sideContentInner').empty();
            }).on('mouseover', marker.openPopup.bind(marker)).openPopup();
            workLayer.push(marker);
        }

        workLayer = L.layerGroup(workLayer);

        // the other main entry i want to show    
        var otherMainentryLayer = [];    
        // entry markers
        var otherMainentryMarkers = myData.work.othermainentry;
        var otherMainentryMarker = L.icon({
            iconUrl: otherMainentryMarkers.options.iconUrl,
            iconSize: [parseInt(otherMainentryMarkers.options.iconSize.width), parseInt(otherMainentryMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(otherMainentryMarkers.options.iconAnchor.x), parseInt(otherMainentryMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(otherMainentryMarkers.options.popupAnchor.x), parseInt(otherMainentryMarkers.options.popupAnchor.y)]
            //popupAnchor: [videoMarkers.options.popupAnchor.x, videoMarkers.options.popupAnchor.y]
        });

        for(var i in otherMainentryMarkers.nodes) {
            //console.log(i);
            var otherMainentrySubset = otherMainentryMarkers.nodes[i];
            var marker = L.marker([otherMainentrySubset.lat, otherMainentrySubset.lng], {icon: otherMainentryMarker});
            marker.on('click', function(e) {
                //handleMarkerClick($(this)[0].options.data);
                //$('#sideContent').animate({'right':'0'});
                //$('#sideContentInner').empty();

            });
            otherMainentryLayer.push(marker);
        }

        otherMainentryLayer = L.layerGroup(otherMainentryLayer);

        // the single main entry i want to show    
        var mainentryLayer = [];    
        // entry markers
        var mainentryMarkers = myData.work.mainentry;
        var mainentryMarker = L.icon({
            iconUrl: mainentryMarkers.options.iconUrl,
            iconSize: [parseInt(mainentryMarkers.options.iconSize.width), parseInt(mainentryMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(mainentryMarkers.options.iconAnchor.x), parseInt(mainentryMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(mainentryMarkers.options.popupAnchor.x), parseInt(mainentryMarkers.options.popupAnchor.y)]
        });

        for(var i in mainentryMarkers.nodes) {
            //console.log(i);
            var mainentrySubset = mainentryMarkers.nodes[i];
            var marker = L.marker([mainentrySubset.lat, mainentrySubset.lng], {icon: mainentryMarker}).bindPopup(eval('mainentryMarkers.content.popupText.' + myLang));
            marker.on('click', function(e) {
                handleMarkerClick(mainentryMarkers.content);
                map.removeLayer(fullWaterLayer);
                map.addLayer(otherMainentryLayer);
                map.addLayer(staircaseentryLayer);
                //handleMarkerClick($(this)[0].options.data);
                //$('#sideContent').animate({'right':'0'});
                //$('#sideContentInner').empty();

            }).on('mouseover', marker.openPopup.bind(marker)).openPopup();
            mainentryLayer.push(marker);
        }

        mainentryLayer = L.layerGroup(mainentryLayer);

        // full water layer
        var fullWaterLayer = [];    
        // entry markers
        var fullWaterMarkers = myData.work.allwaterpipes;
        var fullWaterMarker = L.icon({
            iconUrl: fullWaterMarkers.options.iconUrl,
            iconSize: [parseInt(fullWaterMarkers.options.iconSize.width), parseInt(fullWaterMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(fullWaterMarkers.options.iconAnchor.x), parseInt(fullWaterMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(fullWaterMarkers.options.popupAnchor.x), parseInt(fullWaterMarkers.options.popupAnchor.y)]
        });

        for(var i in fullWaterMarkers.nodes) {
            var fullWaterSubset = fullWaterMarkers.nodes[i];
            var marker = L.marker([fullWaterSubset.lat, fullWaterSubset.lng], {icon: fullWaterMarker});
            marker.on('click', function(e) {
                //handleMarkerClick(waterMarkers.content);

                //handleMarkerClick($(this)[0].options.data);
                //$('#sideContent').animate({'right':'0'});
                //$('#sideContentInner').empty();
                //map.addLayer(staircaseentryLayer);

            });
            fullWaterLayer.push(marker);
        }

        fullWaterLayer = L.layerGroup(fullWaterLayer);

        // main water marker
        var waterLayer = [];    
        // entry markers
        var waterMarkers = myData.work.waterpipes;
        var waterMarker = L.icon({
            iconUrl: waterMarkers.options.iconUrl,
            iconSize: [parseInt(waterMarkers.options.iconSize.width), parseInt(waterMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(waterMarkers.options.iconAnchor.x), parseInt(waterMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(waterMarkers.options.popupAnchor.x), parseInt(waterMarkers.options.popupAnchor.y)]
        });

        for(var i in waterMarkers.nodes) {
            var waterSubset = waterMarkers.nodes[i];
            var marker = L.marker([waterSubset.lat, waterSubset.lng], {icon: waterMarker}).bindPopup(eval('waterMarkers.content.popupText.' + myLang));
            marker.on('click', function(e) {
                handleMarkerClick(waterMarkers.content);

                //handleMarkerClick($(this)[0].options.data);
                //$('#sideContent').animate({'right':'0'});
                //$('#sideContentInner').empty();
                map.addLayer(fullWaterLayer);                
                map.removeLayer(otherMainentryLayer);
                map.removeLayer(staircaseentryLayer);

            }).on('mouseover', marker.openPopup.bind(marker)).openPopup();
            waterLayer.push(marker);
        }

        waterLayer = L.layerGroup(waterLayer);

        // Staircase entry
        var staircaseentryLayer = [];    
        // entry markers
        var staircaseentryMarkers = myData.work.staircaseentry;
        var staircaseentryMarker = L.icon({
            iconUrl: staircaseentryMarkers.options.iconUrl,
            iconSize: [parseInt(staircaseentryMarkers.options.iconSize.width), parseInt(staircaseentryMarkers.options.iconSize.height)],
            iconAnchor: [parseInt(staircaseentryMarkers.options.iconAnchor.x), parseInt(staircaseentryMarkers.options.iconAnchor.y)],
            popupAnchor: [parseInt(staircaseentryMarkers.options.popupAnchor.x), parseInt(staircaseentryMarkers.options.popupAnchor.y)]
        });

        for(var i in staircaseentryMarkers.nodes) {
            var staircaseentrySubset = staircaseentryMarkers.nodes[i];
            var marker = L.marker([staircaseentrySubset.lat, staircaseentrySubset.lng], {icon: staircaseentryMarker, data: staircaseentrySubset});
            marker.on('click', function(e) {
                //handleMarkerClick($(this)[0].options.data);
                //$('#sideContent').animate({'right':'0'});
                //$('#sideContentInner').empty();
            });
            staircaseentryLayer.push(marker);
        }

        staircaseentryLayer = L.layerGroup(staircaseentryLayer);
        // Convert to a leaflet layer

        // Create map
        var mapDefaultZoom = 2;
        var mapMinZoom = 1;
        var mapMaxZoom = 3;
        var map = L.map('map', {
          maxZoom: mapMaxZoom,
          minZoom: mapMinZoom,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          crs: L.CRS.Simple
        });

        // Build legend




        $(window).resize(function() {
            frameMap();
        }); 

        function frameMap() {
            var sideWidth = $('#sideContent').width();
            if($('#sideContent').hasClass('nodisplay') || $('#sideContent').css('display')==='none' || deviceType==="phone")
                sideWidth = 0; // ignore the side width in this case


            //console.log('sidewidth: ' + sideWidth);
            var topHeight = $('#sectionContainer').position().top+$('#sectionContainer').outerHeight(true) - 100;

            var options = {
                paddingBottomRight: [sideWidth, 0],
                paddingTopLeft: [0, topHeight]
            }

            // Need to add padding for top if on mobile


            /*
            if(pixels>=800000) {
                map.setView([-50, 90], mapMaxZoom, options);
            } else if (pixels>=500000) {
                map.setView([-45, 75], mapDefaultZoom, options);
            } else {
                map.setView([-55, 75], mapMinZoom, options);
            }
            */

                map.fitBounds([[-20,20],[-90,140]], options);
        }




        $('.option').click(function() {
            // Need to add the hide class to the dek here
            $('#sectionContainer .dek').addClass('hide');
            var option = $(this).data('option');
            $('.option').removeClass('selected');
            $(this).addClass('selected');


            $('#sideContent').addClass('nodisplay');
            $('#sideContentInner').empty();
            $('.option_explainer').removeClass('explain');
            $('.option_explainer[data-option="' + option + '"]').addClass('explain');
            
            if(option==="walk") {
                map.removeLayer(viceLayer);
                map.removeLayer(workLayer);
                map.removeLayer(mainentryLayer);
                map.removeLayer(otherMainentryLayer);
                map.removeLayer(waterLayer);
                map.removeLayer(staircaseentryLayer);
                map.addLayer(keyLayer);
                map.addLayer(videoLayer);
                $('#legend').hide();

                // Build side content
                //$('#sideContent').removeClass('nodisplay').addClass('hide');
                //buildMedia('chart', 'lifeIntroChart', myData.section.chart, null, $('#sideContentInner'), false);
            } else if (option==="vice") {                
                map.removeLayer(videoLayer);                
                map.removeLayer(keyLayer);
                map.removeLayer(workLayer);
                map.removeLayer(mainentryLayer);
                map.removeLayer(otherMainentryLayer);
                map.removeLayer(waterLayer);
                map.removeLayer(staircaseentryLayer);
                map.addLayer(viceLayer);
                $('#legend').hide();
            } else if (option==="work") {
                map.removeLayer(viceLayer);              
                map.removeLayer(keyLayer);
                map.removeLayer(videoLayer);
                map.removeLayer(staircaseentryLayer);
                map.addLayer(workLayer);     
                map.addLayer(mainentryLayer);
                map.addLayer(waterLayer);           
                $('#legend').show();
                //map.addLayer(staircaseentryLayer);
                //console.log("adding work layer");
            }

            $(window).resize();
        })

        // Default display
        function defaultDisplay() {
            if(deviceType==="tablet" || deviceType==="computer") {
                $('.option').first().addClass('selected');
                $('#legend').hide();
                map.addLayer(keyLayer);
                map.addLayer(videoLayer);
                $('.option_explainer[data-option="walk"]').addClass('explain');
                buildMedia('chart', 'lifeIntroChart', myData.section.chart, null, $('#sideContentInner'), false);
            }
        }

        defaultDisplay();
        // TODO: Need to display the side bar with the default graphics.

        // Add layers
        /*
        var overlayData = {
            "Take a Walk": videoLayer,
            "City of Vice": viceLayer,
            "How it Worked": workLayer
        }; */

        //L.control.layers(overlayData).addTo(map);

        // TODO: plug in the layers here
        
        // Set color
        $('.leaflet-container').css({'background-color':'#CFDDD8'});

        /*
        var mapBounds = new L.LatLngBounds(
            map.unproject([0, 1024], mapMaxZoom),
            map.unproject([1280, 0], mapMaxZoom)); */

        //console.log("Building map");
            
        //map.fitBounds(mapBounds);
        L.tileLayer('map/non-geo/{z}/{x}/{y}.png', {
          minZoom: mapMinZoom, maxZoom: mapMaxZoom,
          //bounds: mapBounds,
          attribution: 'Rendered with <a href="http://www.maptiler.com/">MapTiler</a>',
          noWrap: true          
        }).addTo(map);


        // TODO: this is for debugging
        map.on('click', function(e) { 
            //console.log('{"lat":"' + e.latlng.lat + '", "lng":"' + e.latlng.lng + '"},') ;
        });

        
        $(window).resize();

        //var html='<div id="life;

        function handleMarkerClick(dataSubset) {

            //console.log(dataSubset);
            trackPage('marker_click');
            
            if(dataSubset.type==="full") {
                $('#sideContent').removeClass('hide').removeClass('nodisplay');
                $(window).resize();

                var sideHtml = '<div id="sideContentHed">';
                sideHtml += '<div class="hed">' + $('#sectionOptionContainer .option.selected').html() + '</div>';
                
                if(typeof dataSubset.popupText!=='undefined')
                    sideHtml += '<div class="dek">' + eval('dataSubset.popupText.' + myLang) + '</div>';

                sideHtml += '</div>';

                sideHtml += '<div id="sideContentPhoto">';
                sideHtml += '</div>';

                sideHtml += '<div id="sideContentLower">';
                sideHtml += '<div class="sideContentText">';
                sideHtml += eval('dataSubset.description.' + myLang);
                sideHtml += '</div>';

                sideHtml += '<div class="sideContentQuote">';
                sideHtml += '<div class="quoteText">' + eval('dataSubset.quoteText.' + myLang) + '</div>';
                sideHtml += '<div class="quoteCredit">' + eval('dataSubset.quoteCredit.' + myLang) + '</div>';
                sideHtml += '</div>';

                sideHtml += '<div id="sideContentChart">';
                sideHtml += '</div>';

                sideHtml += '<div class="sideContentInfo">';

                sideHtml += '<div class="description">' + eval('dataSubset.facts.description.' + myLang) + '</div>';

                var facts = dataSubset.facts;

                for(var j in facts.elements) {
                    sideHtml += eval('facts.elements[j].name.' + myLang) + ' <span class="highlight">' + eval('facts.elements[j].description.' + myLang) + '</span><br/>';
                }

                sideHtml += '<div class="sideContentCreditSource>' + eval('facts.source.' + myLang) + '</div>';

                sideHtml += '</div>';

                // 13 myData.content.people.elements[13].
                //sideHtml += 


                $('#sideContentInner').html(sideHtml); 

                $(window).resize();


                // if we have a chart, let's build it
                if(typeof dataSubset.chart!=='undefined') {
                    buildMedia('chart', 'sideContentChart_graphic', dataSubset.chart, null, $('#sideContentChart'), false)
                }

                if(typeof dataSubset.mediaUrl!=='undefined') {
                    buildMedia('photo','markerPhoto',dataSubset,eval('dataSubset.credit.'+myLang),$('#sideContentPhoto'),false);
                }

                // lazy workaround
                //$('#markerPhoto img').attr('src',$('#markerPhoto').data('src'));
            } else if(dataSubset.type==="video") {
                // get rid of the side content
                $('#sideContent').addClass('nodisplay');
                $('#sideContentInner').empty();
                $(window).resize();

                $.magnificPopup.open({
                      items: {
                          src: '<div id="section-popup"></div>',
                          type: 'inline'
                      },
                      closeBtnInside: true,
                      callbacks: {
                            open: function() {
                                buildMedia('video','mapVideo_' + i, dataSubset.contents, "", $("#section-popup"), true);


                                $("#section-popup").append('<button title="Close (Esc)" type="button" class="mfp-close">×</button>');
                            }
                        }
                });
            }
        }

    }

    function buildPeople() {

        // hide the sidebar
        $('#sideContentInner').empty();

        // Main container
        //var html ='<div id="buildingContainer" class="absolute-center">';
        var html ='<div id="buildingContainer" class="">';
        
        var tableHtml = '<table class="columnscontainer">';   
        tableHtml += '<td class="columnleft" width="*%"></td>';
        tableHtml += '<td class="columnmiddle" width="*%">';
        tableHtml += '<div id="peopleContent" class="">';                             
        tableHtml += '</div>';
        tableHtml += '</td>';
        tableHtml += '<td class="columnright" width="*%"></td>';
        tableHtml += '</table>';

        $('#mainContent').append(tableHtml);

        html += '<div id="building_main" class="building">';

        html += '</div>';

        /*

        html += '<div id="building_roof" class="building">';     
        html += '<div><img src="images/rooms/StairwayRoof.png"/></div>'; 
        html += '</div>'; */

        html += '<div id="building_stairs" class="building">';     
        html += '<div><img src="images/rooms/StairWell.jpg"/></div>';
        html += '</div>';

        html += '</div>';


        html += '<div class="downArrow"></div>';

        /*

        var html='<div id="buildingContainer" class="absolute-center">';
        html += '</div>'; */

        $('#peopleContent').append(html);



        var elements = myData.elements;

        for(var i in elements) {
            var elementHtml = "";

            if(elements[i].type==="static") {
                elementHtml += '<div data-element="' + i + '" class="static" style="width:' + elements[i].width + ';"><img src="' + elements[i].url + '" /></div>';
            } else if(elements[i].type==="animation") {
                elementHtml += '<div data-element="' + i + '" class="animation" data-speed="' + elements[i].speed + '" style="width:' + elements[i].width + ';">';

                // Tooltip
                elementHtml += '<div id="peopleTooltip_' + i + '" class="tooltip">';                
                elementHtml += '<div class="dek">' + eval('elements[i].title.' + myLang) + '</div>';
                elementHtml += '</div>';

                // Base unanimated layer
                elementHtml += '<img class="animation_base" src="' + elements[i].url + '"/>';

                // Now the animation frames
                for(var j in elements[i].frames) {
                    elementHtml += '<div class="animation_frame">';
                    elementHtml += '<img class="animation_notselected" style="display:none;" src="' + elements[i].frames[j].url + '"/>';
                    elementHtml += '<img class="animation_selected" style="display:none;" src="' + elements[i].frames[j].selectedUrl + '"/>';
                    elementHtml += '</div>';
                }
                elementHtml += '</div>';
            }

            $('#building_main').append(elementHtml);

            // Move the tooltip
            if(elements[i].type==="animation") {
                // Translate tooltip position
                if(typeof elements[i].tooltip!=='undefined') {
                    $('#peopleTooltip_' + i).css('-ms-transform','translate(' + elements[i].tooltip.x + ', ' + elements[i].tooltip.y  + ')');
                    $('#peopleTooltip_' + i).css('-webkit-transform','translate(' + elements[i].tooltip.x + ', ' + elements[i].tooltip.y  + ')');
                    $('#peopleTooltip_' + i).css('transform','translate(' + elements[i].tooltip.x + ', ' + elements[i].tooltip.y  + ')');
                }
            }
        }


        // Animate everything
        $('.animation').mouseover(function() {
                $(this).addClass('hover');
                $(this).find('.tooltip').stop().animate({'opacity':1},100);
        })

        $('.animation').mouseout(function() {
            $(this).removeClass('hover');
            $(this).find('.tooltip').stop().animate({'opacity':0},100);
        })

        $('.animation').click(function() {

            trackPage('animation_click');
            $('.animation').removeClass('selected');
            $(this).addClass('selected');
        })

        $('.animation').each(function() {


            // loop through each animation here
            $(this).children('.animation_base').hide();

            var frames = $(this).children('.animation_frame');
            //console.log(frames);
            var currentFrame = 0;

            /*
            if(frames.eq(currentFrame).parent().hasClass('hover') || frames.eq(currentFrame).parent().hasClass('selected'))
                frames.eq(currentFrame).attr('src', frames.eq(currentFrame).data('selectedurl'));
            else
                frames.eq(currentFrame).attr('src', frames.eq(currentFrame).data('url'));

            frames.eq(currentFrame).addClass('active'); */

            intervalHandle.push(setInterval(function () { 
                var previousFrame = currentFrame;
                
                if(currentFrame==frames.length-1)
                    currentFrame = 0;
                else
                    currentFrame++;

                if(frames.eq(currentFrame).parent().hasClass('hover') || frames.eq(currentFrame).parent().hasClass('selected')) {
                    frames.eq(previousFrame).find('img').removeClass('active');
                    frames.eq(currentFrame).find('.animation_selected').addClass('active');
                    //frames.eq(currentFrame).attr('src', frames.eq(currentFrame).data('selectedurl'));
                } else {
                    frames.eq(previousFrame).find('img').removeClass('active');
                    frames.eq(currentFrame).find('.animation_notselected').addClass('active');
                }
                    //frames.eq(currentFrame).attr('src', frames.eq(currentFrame).data('url'));

                //frames.eq(previousFrame).removeClass('active');
                //frames.eq(currentFrame).addClass('active');
            }, parseInt($(this).data('speed')))); 

            // TODO: action when clicked here? Switch to highlighed version?

        });

        $('.animation').click(function() {
            $(this).find('.tooltip').stop().animate({'opacity':0},100);
            $('#sideContent').removeClass('nodisplay');
            $(window).resize();
            var elementId = $(this).data('element');

            var sideHtml = '<div id="sideContentHed">';
            sideHtml += '<div class="hed">' + eval('myData.section.sidebar.' + myLang) + '</div>';
            sideHtml += '<div class="dek">' + eval('myData.elements[elementId].title.' + myLang) + '</div>';
            sideHtml += '</div>';

            sideHtml += '<div id="sideContentVideo">';
            sideHtml += '</div>';

            sideHtml += '<div id="sideContentLower">';
            sideHtml += '<div class="sideContentText">';
            sideHtml += eval('myData.elements[elementId].dek.' + myLang);
            sideHtml += '</div>';

            sideHtml += '<div class="sideContentInfo">';

            var facts = myData.elements[elementId].facts;

            for(var j in facts) {
                sideHtml += eval('facts[j].name.' + myLang) + ' <span class="highlight">' + eval('facts[j].description.' + myLang) + '</span><br/>';
            }

            sideHtml += '</div>';

            sideHtml += '<div id="sideContentChart">';
            sideHtml += '</div>';

            // 13 myData.content.people.elements[13].
            //sideHtml += 

            $('#sideContentInner').html(sideHtml);

            // if we have a chart, let's build it
            if(typeof myData.elements[elementId].chart!=='undefined') {
                buildMedia('chart', 'sideContentChart_graphic', myData.elements[elementId].chart, null, $('#sideContentChart'), false)
            }

            // build the video
            buildMedia('video', 'peopleVideo_' + i, myData.elements[elementId].video, "", $("#sideContentVideo"), true);
        });

    }

    function buildHistory() {

        // Build an internal side nav
        //$('#mainContent').addClass("history");
        $('#mainContent').html('<div id="internalSideContent"><div id="sideContentInner"></div></div><div class="downArrow"></div>');


        // Freeze the nav
        //$('#sideContentInner').portamento({wrapper: $('#internalSideContent')});

        /*
        // Build the side content
        $('#sideContentInner').empty();
        $('#sideContentInner').html("<div id='sideContentNav'></div>");
        */

        // Build contents
        var timeline = myData.timeline;

        function buildNav() {
            //console.log("Building the nav");

            $('#sideContentInner').html('<div id="sideContentNav"></div>');

            /*
            // build the nav holder
            var navHolder = d3.select('#sideContentNav')
                .append("svg")
                .attr("width", 40)
                .attr("height", 2000);

            // To do, make this programatical based on the number of timeline entries
            var navLine = navHolder.append("svg:line")
                .attr("x1", 15)
                .attr("y1", 15)
                .attr("x2", 15)
                .attr("y2", 15)
                .style("stroke", "#C25227");
                */

            
            for (var i in timeline) {
                var html = "<div id='sideContentEntry_" + i + "' class='sideContentEntry'>";
                html += "<div class='sideContentHed'>";
                html += "<span class='hed'>" + eval('timeline[i].hed.' + myLang) + "</span>";
                html += "</div><div class='sideContentLower'>";
                html += eval('timeline[i].date.' + myLang);
                html += "<br><br>";
                html += eval('timeline[i].dek.' + myLang);
                html += "</div></div>";
                $('#sideContentInner').append(html);

            }
        }

        // build d3 line
        function buildNavLine() {
            $('#sideContentNav').empty();

            var navHolder = d3.select('#sideContentNav')
                .append("svg")
                .attr("width", 40)
                .attr("height", 2000);

            // To do, make this programatical based on the number of timeline entries
            var navLine = navHolder.append("svg:line")
                .attr("x1", 15)
                .attr("y1", 15)
                .attr("x2", 15)
                .attr("y2", 15)
                .style("stroke", "#C25227");

            $('.sideContentEntry').each(function() {
                var circle = navHolder.append("svg:circle")
                    .style("stroke", "#C25227")
                    .attr("data-entry", '#' + $(this).attr('id'))
                    .attr("r", 10)
                    .attr("cx", 15)
                    .attr("cy", $(this).offset().top - 25)
                    .on("mouseover", function() {
                        //console.log(i);

                        if(d3.select(this).attr('class')!=='selected')
                            $(d3.select(this).attr("data-entry")).addClass('highlight');
                        d3.select(this).attr('class','highlight');
                    })
                    .on("mouseout", function(){
                        $(d3.select(this).attr("data-entry")).removeClass('highlight');
                        
                        // remove highlight if not selected
                        if(d3.select(this).attr('class')!=='selected')
                            d3.select(this).attr('class','');
                    })
                    .on("click", function() {
                        $('.sideContentEntry').removeClass('selected');
                        $(d3.select(this).attr("data-entry")).addClass('selected');
                    }); 

                navLine.attr("y2", $(this).offset().top - 15);
                navHolder.attr("height", $(this).offset().top + $(this).height());
            });

            $('#sideContentEntry_0').addClass('selected');
            $('circle[data-entry=#sideContentEntry_0]').attr('class','selected');
            
        }

        function buildNavHandling(d3only) {

            //console.log("inside build nav handling");
            // Connect the entries
            $('.sideContentEntry').mouseover(function() {
                if(!d3only) {
                    //console.log("mouse over side content entry");
                    $(this).addClass('highlight');
                }

                if($('circle[data-entry="#' + $(this)[0].id + '"]').attr('class')!=='selected')
                    $('circle[data-entry="#' + $(this)[0].id + '"]').attr('class','highlight');
            });

            $('.sideContentEntry').mouseout(function() {
                if(!d3only) {
                    //console.log("mouse out side content entry");
                    $(this).removeClass('highlight');
                }
                // TODO: Only remove the circle fill IF the sideContentEntry ISN'T also selected
                if($('circle[data-entry="#' + $(this)[0].id + '"]').attr('class')!=='selected')
                    $('circle[data-entry="#' + $(this)[0].id + '"]').attr('class','');
            });

            $('.sideContentEntry').click(function() {

                trackPage('history_nav_click');
                if(!d3only) {
                    //console.log("click side content entry");
                    $('.sideContentEntry').removeClass('selected');
                    $(this).addClass('selected');
                }

                $('circle[data-entry]').attr('class','');
                $('circle[data-entry="#' + $(this)[0].id + '"]').attr('class','selected');

                if(!d3only) {
                    $('body').animate({
                        scrollTop: $('.mainContentEntry[data-entry="#' + $(this)[0].id + '"]').offset().top + 10
                    }, 500);
                }
            });

            $('circle[data-entry]').click(function() {  
                trackPage('history_nav_click');
                //console.log("circle click");
                $('.sideContentEntry').removeClass('selected');
                $($(this).data('entry')).addClass('selected');
                //console.log('circle[data-entry="#' + $(this)[0].id + '"]');                
                $('circle[data-entry]').attr('class','');
                $(this).attr('class','selected');

                $('html, body').animate({
                    scrollTop: $('.mainContentEntry[data-entry="' + $(this).data('entry') + '"]').offset().top + 10
                }, 500);
            });
        }

        // Now build the nav
        buildNav();
        buildNavLine();
        buildNavHandling(false);

        // Now build the main contents 
        for(var i in timeline) {
            var mainHtml = '<div data-entry="#sideContentEntry_' + i + '" class="mainContentEntry">';            
            mainHtml += '<div class="mainContentPadding" style="padding-top:35px"></div>';
            mainHtml += '<div class="mainContentMedia"></div>';
            mainHtml += '<div class="mainContentDescription">';
            mainHtml += '<span class="hed">' + eval('timeline[i].hed.' + myLang) + '</span>';
            mainHtml += '<br><br>'
            
            //mainHtml += '<span class="subhed">' + timeline[i].hed + '</span>';
            mainHtml += '</div>';
            mainHtml += '</div>';

            $('#mainContent').append(mainHtml);

            for(var j in timeline[i].contents) {
                var subHtml = '<div id="mainContentSubEntry_' + i + '_' + j + '" class="mainContentSubEntry">';

                subHtml += '<div class="mainContentSubDescription">';
                subHtml += '<span class="subdate">' + eval('timeline[i].contents[j].date.' + myLang) + '</span>';

                if(timeline[i].contents[j].hed.length > 0)
                    subHtml += ': <span class="subhed">' + eval('timeline[i].contents[j].hed.' + myLang) + '</span>';

                subHtml += '<br><br><span class="subdek">' + eval('timeline[i].contents[j].dek.' + myLang) + '</span>';
                subHtml += '</div>';
                subHtml += '<div id="mainContentSubMedia_' + i + '_' + j + '" class="mainContentSubMedia">';
                subHtml += '</div>';
                subHtml += '<div id="mainContentSubChart_' + i + '_' + j + '" class="mainContentSubChart">';
                subHtml += '</div>';
                subHtml += '</div>';

                $('.mainContentEntry[data-entry="#sideContentEntry_' + i + '"]').append(subHtml);

                // if it contains media?
                if(typeof timeline[i].contents[j].mediaType!=='undefined')
                    buildMedia(timeline[i].contents[j].mediaType, 'timeline_' + i + '_' + j, timeline[i].contents[j], eval('timeline[i].contents[j].mediaCredit.' + myLang), $('#mainContentSubMedia_' + i + '_' + j), false);

                // if it contains a chart?
                if(typeof timeline[i].contents[j].chart!=='undefined')
                    buildMedia('chart', 'timelineChart_' + i + '_' + j, timeline[i].contents[j].chart, null, $('#mainContentSubChart_' + i + '_' + j), false);
            }

            //function buildMedia(type, id, content, target) {

            
            
        }


        // Build the intro video
        mainHtml = '<div class="mainContentEntry">';
        /*mainHtml += '<div class="mainContentDescription">';
        mainHtml += '<span class="hed">Introduction</span>';
        mainHtml += '<br><br>'
        
        //mainHtml += '<span class="subhed">' + timeline[i].hed + '</span>';
        mainHtml += '</div>'; */
        mainHtml += '<div id="mainContentIntro" class="mainContentMedia">';
        // TODO: Logic here about photo or video
        //mainHtml += '<img src="http://localhost:8088/public/resources/images/BN-BX770_Slide0_M_20140314235648.jpg"/>';
        mainHtml += '</div>';
        mainHtml += '</div>';
        $('#mainContent').prepend(mainHtml);
        buildMedia('video', 'timelineIntroVideo', myData.section.introVideo, null, $('#mainContentIntro'), false);

        $(window).resize(function() {
            buildNavLine();
            buildNavHandling(true);
        });


        // Scroller to handle positional highlights
        $('.mainContentSubEntry').waypoint(
          function(direction) {
            //console.log(direction);
            //console.log("waypoint 50%: " + $(this).html());
            $('.sideContentEntry').removeClass('selected');
            $($(this).parent().data('entry')).addClass('selected');
            
            /*
            if(typeof $($(this).parent().data('entry')).offset()!=='undefined') {
                $('#internalSideContent').animate({
                    //scrollTop: $($(this).data('entry')).offset().top
                }, 500);
            } */
            
            $('circle[data-entry].selected').attr('class','');
            $('circle[data-entry="' + $(this).parent().data('entry') + '"]').attr('class','selected');
          }, {  
            offset: '50%'
          });

        // Handle scroll freeze
        var top;
        $('#internalSideContent').mouseenter(function() {
            //top = $(window).scrollTop();
            //$('body').addClass('noscroll').css({top: -top + 'px'});
        }).mouseleave(function() {
            //$('body').removeClass('noscroll');
            //$(window).scrollTop(top);
        });

        setTimeout( function(){ 
            $(window).resize();
        }, 1000);

        /*
        var firstCircle = navHolder.append("svg:circle")
            .style("stroke", "red")
            .style("fill", "white")
            .attr("r", 10)
            .attr("cx", 15)
            .attr("cy", 15)
            .on("mouseover", function(){d3.select(this).style("fill", "pink");})
            .on("mouseout", function(){d3.select(this).style("fill", "white");});

        var secondCircle = navHolder.append("svg:circle")
            .style("stroke", "red")
            .style("fill", "white")
            .attr("r", 10)
            .attr("cx", 15)
            .attr("cy", 252)
            .on("mouseover", function(){d3.select(this).style("fill", "pink");})
            .on("mouseout", function(){d3.select(this).style("fill", "white");}); */

        // Build the main content


    }

    function buildPop() {


        // TODO: Automate this.
        // Build units containing the data
        $('#mainContent').html('<div id="imaginationContainer"></div>');

        for(var i in myData.elements) {
            var html = '<div class="flip-container popContainer">';
            html += '<div class="flipper popContainerInner">';
            html += '<div class="front">';

            // front
            html += '<div class="mediaType ' + myData.elements[i].mediaType + '"></div>';
            html += '<div id="popElement_' + i + '" class="popElement">';
            html += '<div class="popDescription">';
            html += '<div class="hed">' + eval('myData.elements[i].name.' + myLang) + '</div>';

            if(typeof myData.elements[i].year!=="undefined")
                html += '<div class="dek">' + eval('myData.elements[i].year.' + myLang) + '</div>';

            html += '</div></div>';

            html += '</div>';
            html += '<div class="back" data-element="' + i + '">';

            // back
            /*
            html += '<div class="backContainer" style="background-color:red" class="popElement">';
            // TODO logic here about building the back elements. Or should I store this as a variable?

            html += '</div>'; */

            html += '</div>';
            html += '</div>';
            html += '</div>';
            $('#imaginationContainer').append(html);

            

            $('#popElement_' + i).css(
                {'background':'url(' + myData.elements[i].promoUrl + ') no-repeat center'}
            ).addClass('cover');
        }


        

        $('.flip-container .front').click(function() {
            trackPage('imagination_tile_flip');
            var back = $(this).parent().find('.back');
            $('.flip-container').find('.back').attr('id','').empty();
            back.attr('id','flipMovie');
            var i = back.data('element');
            ////alert(back.data('element'));
            ////alert(back.children('.backContainer').data('element'));
            //loadMedia(back);

            //function buildMedia(type, id, content, credit, target) {
            // Type = [photo, video, cinemaograph, slideshow]
            // id = [some value like photo_1]
            // content = [guid, url etc]

            
            


            if(Modernizr.csstransitions) {
                buildMedia(myData.elements[i].mediaType,'popMedia_'+i,myData.elements[i].contents,"",$('#flipMovie'),true);

                $('.flip-container.hover').removeClass('hover');
                $(this).parent().parent().addClass('hover'); 
            } else {
                $('.flip-container .back').css('display','none');
                $('.flip-container .front').css('display','block');
                $(this).parent().parent().find('.back').css('display','block');                
                $(this).parent().parent().find('.front').css('display','none');

                buildMedia(myData.elements[i].mediaType,'popMedia_'+i,myData.elements[i].contents,"",$('#flipMovie'),true);
            }

            if(myData.elements[i].mediaType==="slideshow")
                $('#popMedia_'+i).addClass('absolute-center');
        })

        $('.flip-container .back').click(function() {
            if($(this).find('.builtSlideshow').length==0 && !android) {
                if(Modernizr.csstransitions) {
                        $(this).attr('id','').empty();
                        $('.flip-container.hover').removeClass('hover');
                } else {
                    $(this).attr('id','').empty();
                    $(this).parent().parent().find('.back').css('display','none');             
                    $(this).parent().parent().find('.front').css('display','block');
                }
            }
            
        })


    }

    function buildLegacy() {

        $('#mainContent').html('<div id="legacyVideoContainer"></div><div class="downArrow"></div>');

        


        //$('.legacyVideoInner').height($(window).height());

        
        html = "<div id='creditPadding'></div>";
        html += '<div id="interactiveCredits" class="legacyVideoInner" data-suction="0.1"></div>';

        // TODO: loop through the credits

        $("#legacyVideoContainer").append(html);

        // TODO: WSJ Logo
        $("#interactiveCredits").append("<div id='creditLogo'><img src='http://online.wsj.com/media/kwcWSJlogo.png'/></div>"); 

        for(var i in myData.credits.elements) {
            html = '<div id="creditCategory_' + i + '" class="creditCategory">';
            html += '<div class="leftCreditContainer">';
            html += '<div class="leftCredit">';
            html += eval('myData.credits.elements[i].name.' + myLang);
            html += '</div>';
            html += '</div>';
            html += '<div class="rightCreditContainer">';
            html += '<div class="rightCredit">';

            for(var j in myData.credits.elements[i].members) {
                html += '<div class="creditMember">';

                if(typeof myData.credits.elements[i].members[j].name.en!=='undefined')
                    html += eval('myData.credits.elements[i].members[j].name.' + myLang);
                else 
                    html += myData.credits.elements[i].members[j].name;

                html += '</div>';

                if(typeof myData.credits.elements[i].members[j].organization!=='undefined')
                    if(typeof myData.credits.elements[i].members[j].organization.en!=='undefined') {
                        html += '<div class="creditOrganization">';
                        html += eval('myData.credits.elements[i].members[j].organization.' + myLang);
                        html += '</div>';
                    } else {
                        html += '<div class="creditOrganization">';
                        html += myData.credits.elements[i].members[j].organization;
                        html += '</div>';
                    }

            }

            html += '</div>';
            html += '</div>';
            html += '</div>';

            $("#interactiveCredits").append(html);
        }

        $("#legacyVideoContainer").append("<div id='creditBottomPadding'></div>");
        


        for(var i in myData.elements) {
            var html = '<div class="legacyVideoInner"><div id="legacyElement_' + i + '" class="legacyContentEntry"><div id="legacyElementMedia_' + i + '" class="legacyContentMedia" style=""></div><div id="legacyVideoDescription"><div class="hed"></div><div class="dek">' + eval('myData.elements[i].dek.' + myLang) + '</div></div>';
            html += '</div>';
            html += '<div style="clear:both;"></div>';

            $("#legacyVideoContainer").append(html);


            buildMedia(myData.elements[i].mediaType, 'legacy_' + i, myData.elements[i], eval('myData.elements[i].mediaCredit.' + myLang), $('#legacyElementMedia_' + i),false);
        }

        //

        // Adjust the category height if we resize
        $('.creditCategory').each(function() {
            $(this).height($(this).find('.rightCredit').outerHeight());
        });

        $(window).resize(function() {
            $('.creditCategory').each(function() {
                $(this).height($(this).find('.rightCredit').outerHeight());
            });
        });

        /*

        $('.interactiveCredits').waypoint({
          handler: function() {
            //console.log($(this));
            $(this).animate({'background-color':'rgb(0,0,0)'},1000);
          }
        }, { offset: '25%' });*/
    }

    function cycleImages(containerid,duration){

        var $active = $(containerid+'>.cycleractive');
        var $next = ($active.next('.cyclerimage').length > 0) ? $active.next('.cyclerimage') : $(containerid+'>.cyclerimage:first');
        $next.css('z-index',2);//move the next image up the pile
        $active.fadeOut(duration,function(){//fade out the top image
            $active.css('z-index',1).show().removeClass('cycleractive');//reset the z-index and unhide the image
            $next.css('z-index',3).addClass('cycleractive');//make the next image the top one
        });
    }

    function buildMedia(type, id, content, credit, target, autoplay) {
        // Type = [photo, video, cinemaograph, slideshow]
        // id = [some value like photo_1]
        // content = [guid, url etc]

        // Default the autoplay
        autoplay = typeof autoplay !== 'undefined' ? autoplay : false;

        //console.log("type: " + type);
        //console.log(content);


        if(type==="video") {
            target.html('<div id="' + id + '" class="builtVideo wsjvideo-video-player"></div>')
            var parameters = { 
                guid: eval('content.mediaUrl.' + myLang),  // alternative query = type:'live-channel', query:'nyc',
                //api: 'https://video-api.wsj.com/api-video/',
                api: 'http://localhost:8088/api-video/',
                autoplay: autoplay,
                disableEndscreen: true,
                adsEnabled: true,
                disablePreroll: false,
                enableCaptions: false,
                callback: id
            };

            $("#" + id).height(target.width() / (16/9)).WSJVideo(parameters).on('videoComplete',function() { 
                // Try and close the popup if there is one
                $.magnificPopup.instance.close();
            });

            if(deviceType=='computer') {
                target.append('<div id="enlarge_' + id + '" class="enlarge"></div>');

                $('#enlarge_' + id).click(function() {
                    trackPage('video_fullscreen_click');
                    buildMedia('fullvideo',id,content,credit,target,autoplay);
                });
            }


            // Need to add a full screen button here? But only if not full screen? Can I check magnific?


            $(window).resize(function() {
                $("#" + id).height(target.width() / (16/9));
            });
        } else if(type==="fullvideo") {
            // Rebuild the video (this will stop it playing)
            buildMedia('video',id,content,credit,target,false);

            // But then also pop it up!
            $.magnificPopup.open({
                  items: {
                      src: '<div id="section-popup"></div>',
                      type: 'inline'
                  },
                  closeBtnInside: true,
                  callbacks: {
                        open: function() {
                            buildMedia('video',id+"_full",content,credit,$("#section-popup"),autoplay, true);

                            $("#section-popup").append('<button title="Close (Esc)" type="button" class="mfp-close">×</button>');
                        }
                    }
            });
        } else if (type==="popvideo") {
            target.html('<div id="' + id + '" class="builtPopVideo"></div>')
            var parameters = { 
                guid: eval('content.mediaUrl.' + myLang),  // alternative query = type:'live-channel', query:'nyc',
                // api: 'https://video-api.wsj.com/api-video/',
                api: 'http://localhost:8088/api-video/',
                autoplay: autoplay,
                disableEndscreen: true,
                adsEnabled: true,
                disablePreroll: false
            };

            $("#" + id).height(target.width() / (16/9)).WSJVideo(parameters).on('videoComplete',function() { 
                // Try and close the popup if there is one
                //$.magnificPopup.instance.close();
                
                if(Modernizr.csstransitions) {
                    $("#" + id).parent().attr('id','').empty();
                    $('.flip-container.hover').removeClass('hover');
                } else {
                    $("#" + id).parent().parent().find('.back').css('display','none');             
                    $("#" + id).parent().parent().find('.front').css('display','block');
                    $("#" + id).parent().attr('id','').empty();
                }
            });

            target.append('<div class="videoquoteContainer"><div class="videoquote">' + eval('content.dek.' + myLang) + '</div></div>');

            if(deviceType=='computer') {
                target.append('<div id="enlarge_' + id + '" class="enlarge"></div>');

                $('#enlarge_' + id).click(function() {
                    trackPage('pop_video_fullscreen_click');
                    buildMedia('fullpopvideo',id,content,credit,target,autoplay);
                });
            }

            $(window).resize(function() {
                $("#" + id).height(target.width() / (16/9));
            });
        } else if(type==="fullpopvideo") {
            // Rebuild the video (this will stop it playing)
            buildMedia('popvideo',id,content,credit,target,false);

            // But then also pop it up!
            $.magnificPopup.open({
                  items: {
                      src: '<div id="section-popup"></div>',
                      type: 'inline'
                  },
                  closeBtnInside: true,
                  callbacks: {
                        open: function() {
                            buildMedia('popvideo',id+"_full",content,credit,$("#section-popup"),autoplay, true);

                            $("#section-popup").append('<button title="Close (Esc)" type="button" class="mfp-close">×</button>');
                        }
                    }
            });
        } else if (type==="quote") {
            var html = '<img id="' + id + '"  class="builtQuote" src="' + content.mediaUrl + '"/>';
            html += '<div class="quoteContainer">';
            html += '<div class="quote">' + eval('content.dek.' + myLang) + '</div>';
            html += '</div>';
            target.append(html);
        } else if (type==="pullquote") {
            var html = '<div class="pullquoteContainer">';

            if(content.mediaUrl.orientation==="left") {
                html += '<div class="leftPullQuoteContainer" style="right:40%;width:60%">';
                html += '<div class="leftQuote">' + eval('content.mediaUrl.quote.' + myLang) + '</div>';
                html += '<div class="leftQuoteCredit">' + eval('content.mediaUrl.quoteCredit.' + myLang) + '</div>';
            } else { 
                html += '<div class="leftPullQuoteContainer" style="right:60%;width:40%">';
                html += '<img src="' + content.mediaUrl.imageUrl + '" />';
            }

            html += '</div>';

            if(content.mediaUrl.orientation==="left") {                
                html += '<div class="rightPullQuoteContainer" style="right:60%;width:40%">';
                html += '<img src="' + content.mediaUrl.imageUrl + '" />';
            } else {                 
                html += '<div class="rightPullQuoteContainer" style="right:40%;width:60%">';
                html += '<div class="rightQuote">' + eval('content.mediaUrl.quote.' + myLang) + '</div>';
                html += '<div class="rightQuoteCredit">' + eval('content.mediaUrl.quoteCredit.' + myLang) + '</div>';
            }

            html += '</div>';
            html += '</div>';
            target.append(html);
        } else if (type==="chart") {
            chartdict[content.chartinfo.type].generator(target,content,id);
        } else if (type==="popaudio") {
            //console.log("in media audio");
            var html = '<img src="' + content.mediaUrl + '"/>';
            html += '<div class="audioTease"><img src="http://online.wsj.com/media/kwcSoundNu30.png"/></div>';
            html += '<audio id="' + id + '" class="builtPopAudio audio" loop>';
            html += '<source src="' + content.audio + '.ogg" type="audio/ogg">';
            html += '<source src="' + content.audio + '.mp3" type="audio/mpeg">';
            html += '</audio>';
            target.append(html);

            target.append('<div class="audioquoteContainer"><div class="audioquote">' + eval('content.dek.' + myLang) + '</div></div>');

            //if(autoplay)
                //$('#' + id)[0].play();

        } else if (type==="audio") {
            //console.log("in media audio");
            var html = "<audio id='" + id + "' class='builtAudio audio' loop>"
            html += '<source src="' + content + '.ogg" type="audio/ogg">';
            html += '<source src="' + content + '.mp3" type="audio/mpeg">';
            html += '</audio>';
            target.append(html);

            // if(autoplay)
            //     $('#' + id)[0].play();

        } else if (type==="photo") {
            //console.log("in media photo");
            //console.log(content);
            html = "";
            if(typeof content.mediaUrl.en==='undefined') // no language version
                html += '<img id="' + id + '_lazy" class="lazy builtPhoto" data-src="' + content.mediaUrl + '" src="images/10grey.png"/>';
            else
                html += '<img id="' + id + '_lazy" class="lazy builtPhoto" data-src="' + eval('content.mediaUrl.' + myLang) + '" src="images/10grey.png"/>';


            // Add caption if needed
            if(typeof content.caption!=='undefined' || typeof credit!=='undefined') {
                html += '<div class="captionCreditContainer">';

                if(typeof content.caption!=='undefined')
                    html += '<div class="caption">' + eval('content.caption.' + myLang) + '</div>';
                
                if(typeof credit!=='undefined')
                    html += '<div class="credit">' + credit + '</div>';

                html += '</div>';
            }

            //html += '<div class="photoCredit">' + credit + '</div>';
            target.append(html);

            $('#' + id + '_lazy').unveil(200, function() {
                // we've changed the layout of the page, so let's refresh our waypoints
                $.waypoints('refresh');
            });

            /*
            $('#' + id).magnificPopup({ 
              type: 'image'
                // other options
            }); */
        } else if (type==="cinemagraph") {
            //console.log("in media cinemaograph");

            var theAutoplay = "";
            if(autoplay) 
                theAutoplay = "autoplay";

            var theControls = "";
            if(deviceType==="tablet" || deviceType==="phone")
                theControls = "controls";

            var html = "";

            // TODO: add controls if mobile!

            html += '<video id="' + id + '" class="builtCinemagraph video-js vjs-default-skin" loop ' + theControls + ' preload ' + theAutoplay + ' width="100%" height="100%" poster="' + content.mediaUrl + '.jpg">';
            html += '<source src="' + content.mediaUrl + '.mp4" type="video/mp4" />';
            html += '<source src="' + content.mediaUrl + '.webm" type="video/webm" />';
            html += '<source src="' + content.mediaUrl + '.ogv" type="video/ogg" />';
            html += '</video>';

            target.append(html);

            videojs(id, {}, function(){
              // Player (this) is initialized and ready.
            });

            target.height(target.width() / (16/9));

            $(window).resize(function() {
                target.height(target.width() / (16/9));
            });


            // waypoint it so it plays and stops automatically
            $('video').waypoint(function() {
                  $(this)[0].pause();
                }, {
                  offset: function() {
                    return -$(this).height();
                  }
            });

            $('video').waypoint(function() {
                  $(this)[0].play();
            }, {
                  offset: function() {
                    return $(window).height();
                }
            });
            // add it to the target, and call the videojs initialise
        } else if (type==="slideshow") {
            var html = '<div id="' + id + '" class="builtSlideshow slides">';

            for(var i in content.mediaUrl) {
                html += '<div class="slide_container">';
                //html += '<img src="' + content.mediaUrl[i].url + '" />';
                html += '<div class="slide_image" data-original="" style="width:100%;height:100%;background: url(' + content.mediaUrl[i].url + ') no-repeat center;background-size:cover;"></div>';

                html += '<div class="captionCreditContainer">';

                if(typeof content.mediaUrl[i].caption!=='undefined')
                    html += '<div class="caption">' + eval('content.mediaUrl[i].caption.' + myLang) + '</div>';

                if(typeof content.mediaUrl[i].credit!=='undefined')
                    html += '<div class="credit">' + eval('content.mediaUrl[i].credit.' + myLang) + '</div>';

                html += '</div>';
                html += '</div>';
            }
            
            html += '<div class="leftArrow slidesjs-previous slidesjs-navigation"></div>';
            html += '<div class="rightArrow firstshow slidesjs-next slidesjs-navigation"></div>';
            html += '</div>';

            

            target.append(html);

            $('.rightArrow').mouseover(function() {
                $(this).removeClass('firstshow');
            });

            $('.rightArrow').click(function() {
                $(this).removeClass('firstshow');
            });

            $('#' + id).slidesjs({
                animationStart: function(current) {
                    //alert("you swiped");
                },
                preload: false,
                width: 940,
                height: 528,
                navigation: false
                    // [boolean] Generates next and previous buttons.
                    // You can set to false and use your own buttons.
                    // User defined buttons must have the following:
                    // previous button: class="slidesjs-previous slidesjs-navigation"
                    // next button: class="slidesjs-next slidesjs-navigation"
               
            });


            //console.log("in media slideshow");
            // let's assume that content is an array of URLs?
        }

    }


    /* Chart handling */
    var chartdict={
        "density_chart_type": {
            "generator":drawDensityChart   
        },
        "shops_chart_type": {
            "generator":drawShopsChart
        },
        "wherego_chart_type": {
            "generator":drawWhereGoChart,
        },
        "png_chart_type": {
            "generator":drawPNGChart
        },
        "dimsum_chart_type": {
            "generator":drawDimSumChart
        },
        "triad_chart_type": {
            "generator":drawTriadChart
        },
        "sex_chart_type": {
            "generator":drawSexChart
        }
    };

    function drawDensityChart(target,data,assignid) {
        var templateparms={
            hed:data.chartinfo.hed[myLang],
            dek:data.chartinfo.dek[myLang],
            total_pop:data.chartinfo.total_pop[myLang],
            total_pop_text:data.chartinfo.total_pop_text[myLang],
            area:data.chartinfo.area[myLang],
            area_text:data.chartinfo.area_text[myLang],
            area_subtext:data.chartinfo.area_subtext[myLang],
            building_count:data.chartinfo.building_count[myLang],
            building_count_text:data.chartinfo.building_count_text[myLang],            
            height_image:data.chartinfo.height_image.url,          
            height_count:data.chartinfo.height_count[myLang],
            height_count_text:data.chartinfo.height_count_text[myLang], 
            height_count_subtext:data.chartinfo.height_count_subtext[myLang],            
            source:data.chartinfo.source[myLang],
            density_text:data.chartinfo.string_density[myLang],
            total_density_text:data.chartinfo.total_density_text[myLang],
            units:data.chartinfo.string_units[myLang],
            chartdata:[]
        }

        var scaler=100/Math.sqrt(data.chartinfo.total_density);

        for(var i=0;i<data.values.length;i++) {
            var value=data.values[i];


            templateparms.chartdata.push({
                squarewidth:""+Math.round(Math.sqrt(value.density)*scaler)+"%",
                textwidth:""+(100-Math.round(Math.sqrt(value.density)*scaler))+"%",
                name:value.name[myLang],
                density:numberWithCommas(value.density)
            });

        }
        
        target.html($(Mustache.render($('#densitycharttpl').html(),templateparms)).addClass(assignid));

    }

    function drawShopsChart(target,data,assignid) {
        //console.log(target);
        var i;
        
        

        var total=0;
        for(i=0;i<data.values.length;i++) {
            total+=data.values[i].number;
        }
        var templateparms={
            hed:data.chartinfo.hed[myLang],
            dek:data.chartinfo.dek[myLang],
            string_total:data.chartinfo.string_total[myLang],
            source:data.chartinfo.source[myLang],
            total:total,
            chartdata:[]
        }
        for(i=0;i<data.values.length;i++) {
            var value=data.values[i];


            templateparms.chartdata.push({
                barwidth:""+value.number+"%",
                name:value.name[myLang],
                number:""+value.number
            });

        }

        
        //console.log(target);
        target.html($(Mustache.render($('#shopscharttpl').html(),templateparms)).addClass(assignid));
    }

    function drawWhereGoChart(target,data,assignid) {

        var templateparms={
            hed:data.chartinfo.hed[myLang],
            dek:data.chartinfo.dek[myLang],
            source:data.chartinfo.source[myLang],
            chartdata:[]
        }
        for(i=0;i<data.values.length;i++) {
            var value=data.values[i];


            templateparms.chartdata.push({
                text:value.text[myLang],
                barheight:""+Math.round(value.percent*100)+"%",
                percent:""+Math.round(value.percent*100)+"%",
                first:i==0
            });

        }

        target.html($(Mustache.render($('#wheregocharttpl').html(),templateparms)).addClass(assignid));
    }

    function drawPNGChart(target,data,assignid) {

        var templateparms={
            hed:data.chartinfo.hed[myLang],
            average_size:data.chartinfo.average_size[myLang],
            average_size_text:data.chartinfo.average_size_text[myLang],
            chartimage:data.chartinfo.chartimage[myLang],
            source:data.chartinfo.source[myLang]
        }
        

        target.html($(Mustache.render($('#pngcharttpl').html(),templateparms)).addClass(assignid));
    }

    function drawDimSumChart(target,data,assignid) {

        var templateparms={
            hed:data.chartinfo.hed[myLang],            
            source:data.chartinfo.source[myLang],
            chartdata:[]
        }
        for(i=0;i<data.values.length;i++) {
            var value=data.values[i];
            templateparms.chartdata.push({
                name:value.name[myLang],
                description:value.description[myLang],
                iconlink:value.iconlink,
                usprice:value.usprice[myLang],
                hkprice:value.hkprice[myLang]
            });

        }

        target.html($(Mustache.render($('#dimsumcharttpl').html(),templateparms)).attr("id",assignid));

    }

    function drawTriadChart(target,data,assignid) {
        var templateparms={
            hed:data.chartinfo.hed[myLang],            
            source:data.chartinfo.source[myLang],    
            protection_money_text:data.chartinfo.protection_money_text[myLang],    
            protection_money:data.chartinfo.protection_money[myLang],    
            subhed:data.chartinfo.subhed[myLang],
            chartdata:[]
        }
        for(i=0;i<data.values.length;i++) {
            var value=data.values[i];
            templateparms.chartdata.push({
                name:value.name[myLang],
                iconlink:value.iconlink,
                usprice:value.usprice[myLang],
                hkprice:value.hkprice[myLang]
            });

        }
        target.html($(Mustache.render($('#triadcharttpl').html(),templateparms)).attr("id",assignid));

    }

    function drawSexChart(target,data,assignid) {
        var templateparms={
            hed:data.chartinfo.hed[myLang],          
            source:data.chartinfo.source[myLang],   
            chartdata:[]
        }
        for(i=0;i<data.values.length;i++) {
            var value=data.values[i];
            templateparms.chartdata.push({
                name:value.name[myLang],
                subname:value.subname[myLang],
                usprice:value.usprice[myLang],
                hkprice:value.hkprice[myLang]
            });

        }
        target.html($(Mustache.render($('#sexcharttpl').html(),templateparms)).attr("id",assignid));

    }

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

})();

// http://stackoverflow.com/questions/4814398/how-can-i-check-if-a-scrollbar-is-visible
(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }
})(jQuery);


(function ( $ ) {

$.fn.is_on_screen = function(){
    var win = $(window);
    var viewport = {
        top : win.scrollTop(),
        left : win.scrollLeft()
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();
 
    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();
 
    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
};

})( jQuery );

/**
 * jQuery alterClass plugin
 *
 * Remove element classes with wildcard matching. Optionally add classes:
 *   $( '#foo' ).alterClass( 'foo-* bar-*', 'foobar' )
 *
 * Copyright (c) 2011 Pete Boere (the-echoplex.net)
 * Free under terms of the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 */
(function ( $ ) {
    
$.fn.alterClass = function ( removals, additions ) {
    
    var self = this;
    
    if ( removals.indexOf( '*' ) === -1 ) {
        // Use native jQuery methods if there is no wildcard matching
        self.removeClass( removals );
        return !additions ? self : self.addClass( additions );
    }
 
    var patt = new RegExp( '\\s' + 
            removals.
                replace( /\*/g, '[A-Za-z0-9-_]+' ).
                split( ' ' ).
                join( '\\s|\\s' ) + 
            '\\s', 'g' );
 
    self.each( function ( i, it ) {
        var cn = ' ' + it.className + ' ';
        while ( patt.test( cn ) ) {
            cn = cn.replace( patt, ' ' );
        }
        it.className = $.trim( cn );
    });
 
    return !additions ? self : self.addClass( additions );
};
 
})( jQuery );

