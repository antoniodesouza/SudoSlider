// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/*
 *  Sudo Slider verion 3.1.0 - jQuery plugin
 *  Written by Erik Krogh Kristensen info@webbies.dk.
 *
 *	 Dual licensed under the MIT
 *	 and GPL licenses.
 *
 *	 Built for jQuery library
 *	 http://jquery.com
 *
 */
(function($, win) {
    // Saves space in the minified version.
    var undefined; // Makes sure that undefined really is undefined within this scope.
    var FALSE = false;
    var TRUE = true;

    // Constants
    var PAGES_MARKER_STRING = "pages";
    var NEXT_STRING = "next";
    var PREV_STRING = "prev";
    var LAST_STRING = "last";
    var FIRST_STRING = "first";
    var ABSOLUTE_STRING = "absolute";
    var EMPTY_FUNCTION = function () { };
    var ANIMATION_CLONE_MARKER_CLASS = "sudo-box";

    $.fn.sudoSlider = function(optionsOrg) {
        // default configuration properties
        var defaults = {
            effect:            FALSE,  /*option[0]/*effect*/
            speed:             800, /*   option[1]/*speed*/
            customlink:        FALSE, /* option[2]/*customlink*/
            controlsshow:      TRUE, /*  option[3]/*controlsShow*/
            controlsfadespeed: 400, /*   option[4]/*controlsfadespeed*/
            controlsfade:      TRUE, /*  option[5]/*controlsfade*/
            insertafter:       TRUE, /*  option[6]/*insertafter*/
            vertical:          FALSE, /* option[7]/*vertical*/
            slidecount:        1, /*     option[8]/*slidecount*/
            movecount:         1, /*     option[9]/*movecount*/
            startslide:        1, /*     option[10]/*startslide*/
            responsive:        FALSE, /* option[11]/*responsive*/
            ease:              'swing', /* option[12]/*ease*/
            auto:              FALSE, /* option[13]/*auto*/
            pause:             2000, /*  option[14]/*pause*/
            resumepause:       FALSE, /* option[15]/*resumepause*/
            continuous:        FALSE, /* option[16]/*continuous*/
            prevnext:          TRUE, /*  option[17]/*prevnext*/
            numeric:           FALSE, /* option[18]/*numeric*/
            numerictext:       [], /*    option[19]/*numerictext*/
            slices:            15,  /*   option[20]/*slices*/
            boxcols:           8,  /*    option[21]/*boxCols*/
            boxrows:           4,  /*    option[22]/*boxRows*/
            initcallback:      EMPTY_FUNCTION, /* option[23]/*initCallback*/
            ajaxload:          EMPTY_FUNCTION, /* option[24]/*ajaxload*/
            beforeanimation:   EMPTY_FUNCTION, /* option[25]/*beforeanimation*/
            afteranimation:    EMPTY_FUNCTION, /* option[26]/*afteranimation*/
            history:           FALSE, /* option[27]/*history*/
            autoheight:        TRUE, /*  option[28]/*autoheight*/
            autowidth:         TRUE, /*  option[29]/*autowidth*/
            updatebefore:      FALSE, /* option[30]/*updateBefore*/
            ajax:              FALSE, /* option[31]/*ajax*/
            preloadajax:       100, /*   option[32]/*preloadajax*/
            loadingtext:       '', /*    option[33]/*loadingtext*/
            prevhtml:          '<a href="#" class="prevBtn"> previous </a>', /* option[34]/*prevhtml*/
            nexthtml:          '<a href="#" class="nextBtn"> next </a>', /* option[35]/*nexthtml*/
            controlsattr:      'id="controls"', /* option[36]/*controlsattr*/
            numericattr:       'class="controls"' /* option[37]/*numericattr*/,
            animationzindex:    10000 /* option[38]/*animationZIndex*/
        };
        // Defining the base element.
        var baseSlider = this;

        optionsOrg = $.extend(defaults, objectToLowercase(optionsOrg));

        return this.each(function() {
            var init,
                ul,
                li,
                liConti,
                s,
                t,
                ot,
                ts,
                clickable,
                ajaxloading,
                numericControls,
                numericContainer,
                destroyed,
                destroyT,
                controls,
                nextbutton,
                prevbutton,
                autoTimeout,
                oldSpeed,
                dontCountinue,
                autoOn,
                continuousClones = FALSE,
                numberOfVisibleSlides,
                beforeanimationFired = FALSE,
                asyncTimedLoad,
                callBackList,
                obj = $(this),
                finishedAdjustingTo = FALSE, // This variable teels if the slider is currently adjusted (height and width) to any specific slide. This is usefull when ajax-loading stuff.
                adjustingTo, // This one tells what slide we are adjusting to, to make sure that we do not adjust to something we shouldn't.
                adjustTargetTime = 0, // This one holds the time that the autoadjust animation should complete.
                currentlyAnimating = FALSE,
                currentAnimation,
                currentAnimationCallback,
                awaitingAjaxLoads = [],
                animateToAfterCompletion = FALSE,
                animateToAfterCompletionClicked,

            // Making a "private" copy that i put the "public" options in. The private options can then be changed if i wan't to.
                options = optionsOrg,
                option = [];
            // The call to the init function is after the definition of all the functions.
            function initSudoSlider(destroyT) {
                // Storing the public options in an array.
                var optionIndex = 0;
                for (var key in options) {
                    option[optionIndex] = options[key];
                    optionIndex++;
                }

                init = TRUE;

                // Fix for nested list items
                ul = childrenNotAnimationClones(obj);
                // Is the ul element there?
                var ulLength = ul.length;
                var newUl = $("<div></div>");
                if (!ulLength) {
                    obj.append(ul = newUl);
                } else if (!ul.is("ul")) {
                    newUl.append(ul);
                    obj.append(ul = newUl);
                }


                li = childrenNotAnimationClones(ul);

                s = li.length;

                // Now we are going to fix the document, if it's 'broken'. (No <li>).
                // I assume that it's can only be broken, if ajax is enabled. If it's broken without Ajax being enabled, the script doesn't have anything to fill the holes.
                if (option[31]/*ajax*/) {
                    // Do we have enough list elements to fill out all the ajax documents.
                    if (option[31]/*ajax*/.length > s) {
                        for (var a = 1; a <= option[31]/*ajax*/.length - s; a++) {
                            ul.append("<div>" +  option[33]/*loadingtext*/ + "</div>");
                        }
                        li = childrenNotAnimationClones(ul);
                        s = li.length;
                    }
                }

                t = 0;
                ot = t;
                ts = s-1;

                clickable = TRUE;
                ajaxloading = FALSE;
                numericControls = [];
                destroyed = FALSE;

                // Set obj overflow to hidden (and position to relative <strike>, if fade is enabled. </strike>)
                obj.css({overflow: "hidden"});
                if (obj.css("position") == "static") obj.css({position: "relative"}); // Fixed a lot of IE6 + IE7 bugs.

                // Float items to the left, and make sure that all elements are shown.
                li.css({"float": "left", listStyle: "none"});
                // The last CSS to make it work.
                ul.add(li).css({display: "block", position: "relative"});

                option[8]/*slidecount*/ = parseInt10(option[8]/*slidecount*/);

                // Lets just redefine slidecount
                numberOfVisibleSlides = option[8]/*slidecount*/;

                option[8]/*slidecount*/ += option[9]/*movecount*/ - 1;

                // startslide can only be a number (and not 0). Converting from 1 index to 0 index.
                option[10]/*startslide*/ = parseInt10(option[10]/*startslide*/) - 1 || 0;


                // Every animation is defined using effect.
                // This if statement keeps backward compatibility.
                if (!option[0]/*effect*/) {
                    option[0]/*effect*/ = "slide";
                }

                option[0]/*effect*/ = getEffectMethod(option[0]/*effect*/);

                if (option[16]/*continuous*/) continuousClones = [];

                for (var a = 0; a < s; a++) {
                    if (!option[19]/*numerictext*/[a] && option[19]/*numerictext*/[a] != "") {
                        option[19]/*numerictext*/[a] = (a+1);
                    }
                    option[31]/*ajax*/[a] = option[31]/*ajax*/[a] || FALSE;
                }

                callBackList = [];
                for (var i = 0; i < s; i++) {
                    callBackList[i] = [];
                    callBackList[i].push(li.eq(i));
                }

                // Clone elements for continuous scrolling
                if(continuousClones) {
                    for (var i = option[8]/*slidecount*/ ; i >= 1 && s > 0 ; i--) {
                        var appendRealPos = getRealPos(-option[8]/*slidecount*/ + i - 1);
                        var prependRealPos = getRealPos(option[8]/*slidecount*/-i);
                        var appendClone = li.eq(appendRealPos).clone();
                        continuousClones.push(appendClone);
                        var prependClone = li.eq(prependRealPos).clone();
                        continuousClones.push(prependClone);
                        callBackList[appendRealPos].push(appendClone);
                        callBackList[prependRealPos].push(prependClone);
                        ul.prepend(appendClone).append(prependClone);
                    }
                }

                option[5]/*controlsfade*/ = option[5]/*controlsfade*/ && !option[16]/*continuous*/;

                // Making sure that i have enough room in the <ul> (Through testing, i found out that the max supported size (height or width) in Firefox is 17895697px, Chrome supports up to 134217726px, and i didn't find any limits in IE (6/7/8/9)).
                ul[option[7]/*vertical*/ ? 'height' : 'width'](9000000); // That gives room for about 12500 slides of 700px each (and works in every browser i tested). Down to 9000000 from 10000000 because the later might not work perfectly in Firefox on OSX.

                liConti = childrenNotAnimationClones(ul);

                // If responsive is turned on, autowidth doesn't work.
                option[29]/*autowidth*/ = option[29]/*autowidth*/ && !option[11]/*responsive*/;

                if (option[11]/*responsive*/) {
                    $(win).on("resize focus", adjustResponsiveLayout).resize();
                    setTimeout(adjustResponsiveLayout);
                }

                controls = FALSE;
                if(option[3]/*controlsShow*/) {
                    // Instead of just generating HTML, i make it a little smarter.
                    controls = $('<span ' + option[36]/*controlsattr*/ + '></span>');
                    $(obj)[option[6]/*insertafter*/ ? 'after' : 'before'](controls);

                    if(option[18]/*numeric*/) {
                        numericContainer = $('<ol '+ option[37]/*numericattr*/ +'></ol>');
                        controls.prepend(numericContainer);
                        var distanceBetweenPages = option[18]/*numeric*/ == PAGES_MARKER_STRING ? numberOfVisibleSlides : 1;
                        for(var a = 0; a < s - ((option[16]/*continuous*/ || option[18]/*numeric*/ == PAGES_MARKER_STRING) ? 1 : numberOfVisibleSlides) + 1; a += distanceBetweenPages) {
                            numericControls[a] = $("<li rel='" + (a+1) + "'><a href='#'><span>"+ option[19]/*numerictext*/[a] +"</span></a></li>")
                                .appendTo(numericContainer)
                                .click(function(){
                                    animateToSlide(getRelAttribute(this) - 1, TRUE);
                                    return FALSE;
                                });
                        }
                    }
                    if(option[17]/*prevnext*/){
                        nextbutton = makecontrol(option[35]/*nexthtml*/, NEXT_STRING);
                        prevbutton = makecontrol(option[34]/*prevhtml*/, PREV_STRING);
                    }
                }


                // Lets make those fast/normal/fast into some numbers we can make calculations with.
                var optionsToConvert = [4/*controlsfadespeed*/,1/*speed*/,14/*pause*/];
                for (a in optionsToConvert) {
                    option[optionsToConvert[a]] = textSpeedToNumber(option[optionsToConvert[a]]);
                }

                if (option[2]/*customlink*/) {
                    $(document).on("click", option[2]/*customlink*/, function() {
                        var target;
                        if (target = getRelAttribute(this)) {
                            if (target == 'stop') {
                                option[13]/*auto*/ = FALSE;
                                stopAuto();
                            }
                            else if (target == "start") {
                                startAuto(option[14]/*pause*/);
                                option[13]/*auto*/ = TRUE;
                            }
                            else if (target == 'block') clickable = FALSE;
                            else if (target == 'unblock') clickable = TRUE;
                            else animateToSlide((target == parseInt10(target)) ? target - 1 : target, TRUE);
                        }
                        return FALSE;
                    });
                }

                runOnImagesLoaded(liConti.slice(0,option[8]/*slidecount*/), TRUE, function () {
                    if (option[13]/*auto*/) {
                        startAuto(option[14]/*pause*/);
                    }

                    if (destroyT) {
                        goToSlide(destroyT,FALSE);
                    } else if (option[27]/*history*/) {
                        // I support the jquery.address plugin, Ben Alman's hashchange plugin and Ben Alman's jQuery.BBQ.
                        var window = $(win); // BYTES!
                        var hashPlugin;
                        if (hashPlugin = window.hashchange) {
                            hashPlugin(URLChange);
                        } else if (hashPlugin = $.address) {
                            hashPlugin.change(URLChange);
                        } else {
                            // This assumes that jQuery BBQ is included. If not, stuff won't work in old browsers.
                            window.on("hashchange", URLChange);
                        }
                        URLChange();
                    }
                    else goToSlide(option[10]/*startslide*/,FALSE);

                    setCurrent(t);
                });
                if (option[31]/*ajax*/[option[10]/*startslide*/]) {
                    ajaxLoad(option[10]/*startslide*/, FALSE, 0);
                }
                if (option[32]/*preloadajax*/ === TRUE) {
                    for (var i = 0; i <= ts; i++) {
                        if (option[31]/*ajax*/[i] && option[10]/*startslide*/ != i) {
                            ajaxLoad(i, FALSE, 0);
                        }
                    }
                } else {
                    startAsyncDelayedLoad();
                }
            }
            /*
             * The functions do the magic.
             */

            function arrayToRandomEffect(array) {
                return function (obj) {
                    var effect = pickRandomValue(array);
                    return getEffectMethod(effect)(obj);
                }
            }

            function getEffectMethod(inputEffect) {
                if (isArray(inputEffect)) {
                    return arrayToRandomEffect(inputEffect);
                } else if (isFunction(inputEffect)) {
                    return inputEffect
                } else {
                    if (inputEffect.indexOf(",") != -1) {
                        var array = inputEffect.split(",");
                        return arrayToRandomEffect(array);
                    } else {
                        return objectToLowercase($.fn.sudoSlider.effects)[inputEffect.toLowerCase()];
                    }
                }
            }

            // Adjusts the slider when a change in layout has happened.
            function adjustResponsiveLayout() {
                var oldWidth = liConti.width();
                var newWidth = getResponsiveWidth();
                liConti.width(newWidth);

                if (oldWidth != newWidth) {
                    stopAnimation();
                    autoadjust(t, 0);
                    adjustPositionTo(t);
                }
            }

            // Simply returns the value of the rel attribute for the given element.
            function getRelAttribute(that) {
                return $(that).attr("rel");
            }

            // Returns the width of a single <li> if the page layout is responsive.
            function getResponsiveWidth() {
                return obj.width() / numberOfVisibleSlides;
            }

            // Triggered when the URL changes.
            function URLChange() {
                var target = getUrlHashTarget();
                if (init) goToSlide(target,FALSE);
                else animateToSlide(target, FALSE);
            }

            function startAsyncDelayedLoad () {
                var preloadAjaxTime = parseInt10(option[32]/*preloadajax*/);
                if (option[31]/*ajax*/ && preloadAjaxTime) {
                    for (a in option[31]/*ajax*/) {
                        if (option[31]/*ajax*/[a]) {
                            clearTimeout(asyncTimedLoad);
                            asyncTimedLoad = setTimeout(function(){
                                if (option[31]/*ajax*/[a]) {
                                    ajaxLoad(a, FALSE, 0);
                                } else {
                                    startAsyncDelayedLoad();
                                }
                            }, preloadAjaxTime);

                            break;
                        }
                    }
                }
            }

            function startAuto(pause) {
                autoOn = TRUE;
                autoTimeout = setTimeout(function(){
                    if (autoOn) {
                        animateToSlide(NEXT_STRING, FALSE);
                    }
                },pause);
            }

            function stopAuto(autoPossibleStillOn) {
                clearTimeout(autoTimeout);
                if (!autoPossibleStillOn) autoOn = FALSE;
            }

            function textSpeedToNumber(speed) {
                return (parseInt10(speed) || speed == 0) ?
                    parseInt10(speed) :
                    speed == 'fast' ?
                        200 :
                        (speed == 'normal' || speed == 'medium') ?
                            400 :
                            speed == 'slow' ?
                                600 :
                                400;
            }

            function makecontrol(html, action) {
                return $(html).prependTo(controls).click(function () {
                    animateToSlide(action, TRUE);
                    return FALSE;
                });
            }

            // <strike>Simple function</strike><b>A litle complicated function after moving the auto-slideshow code and introducing some "smart" animations</b>. great work.
            function animateToSlide(i, clicked) {
                var interruptableAnimation = FALSE; // TODO: Use this?
                if (clickable) {
                    // Stopping, because if its needed then its restarted after the end of the animation.
                    stopAuto(TRUE);

                    beforeanimationFired = FALSE;
                    if (!destroyed) {
                        customAni(i, clicked, FALSE);
                    }
                } else {
                    if (interruptableAnimation) {
                        stopAnimation();
                        animateToSlide(i, clicked);
                    } else {
                        animateToAfterCompletion = i;
                        animateToAfterCompletionClicked = clicked;
                    }
                }
            }

            // It may not sound like it, but the variable fadeOpacity is only for TRUE/FALSE.
            function fadeControl (fadeOpacity, fadetime ,nextcontrol) {
                if (nextcontrol) {
                    var eA = nextbutton,
                        directionA = NEXT_STRING;
                } else {
                    var eA = prevbutton,
                        directionA = PREV_STRING;
                }

                if (option[3]/*controlsShow*/ && option[17]/*prevnext*/) {
                    if (fadeOpacity) {
                        eA.stop().fadeIn(fadetime);
                    }
                    else {
                        eA.stop().fadeOut(fadetime);
                    }
                }
                if(option[2]/*customlink*/) {
                    var filterString = "[rel='" + directionA + "']";
                    if (fadeOpacity) {
                        $(option[2]/*customlink*/).filter(filterString).stop().fadeIn(fadetime);
                    }
                    else {
                        $(option[2]/*customlink*/).filter(filterString).stop().fadeOut(fadetime);
                    }
                }
            }

            // Fade the controls, if we are at the end of the slide.
            // It's all the different kind of controls.
            function fadeControls (a,fadetime) {
                fadeControl (a,fadetime,FALSE); // abusing that the number 0 == FALSE.
                // The new way of doing it.
                fadeControl(a < s - numberOfVisibleSlides, fadetime, TRUE);
            }

            // Updating the 'current' class
            function setCurrent(i) {
                i = getRealPos(i) + 1;

                // Fixing that the last numeric control isn't marked when we are at the last possible position.
                if (option[18]/*numeric*/ == PAGES_MARKER_STRING && i == s - numberOfVisibleSlides + 1 && !option[16]/*continuous*/) {
                    i = s;
                }

                if (option[18]/*numeric*/) for (a in numericControls) setCurrentElement(numericControls[a], i);
                if (option[2]/*customlink*/) setCurrentElement($(option[2]/*customlink*/), i);
            }

            function setCurrentElement(element,i) {
                if (element.filter) {
                    element
                        .filter(".current")
                        .removeClass("current");

                    element
                        .filter(function() {
                            var elementTarget = getRelAttribute(this);
                            if (option[18]/*numeric*/ == PAGES_MARKER_STRING) {
                                for (var a = numberOfVisibleSlides - 1; a >= 0; a--) {
                                    if (elementTarget == i - a) {
                                        return TRUE;
                                    }
                                }
                            }
                            else return elementTarget == i;
                            return FALSE;
                        })
                        .addClass("current");
                }
            }

            function getUrlHashTarget() {
                var hashString = location.hash.substr(1)
                for (i in option[19]/*numerictext*/) {
                    if (option[19]/*numerictext*/[i] == hashString) {
                        return i;
                    }
                }
                return hashString ? t : 0;
            }

            function runOnImagesLoaded (target, allSlides, callback) {
                var elems = target.add(target.find("img")).filter("img");
                var len = elems.length;
                if (!len) {
                    callback();
                    // No need to do anything else.
                    return this;
                }
                function loadFunction(that) {
                    $(that).off('load error');
                    //$(that).unbind('load').unbind('error');
                    // Webkit/Chrome (not sure) fix.
                    if (that.naturalHeight && !that.clientHeight) {
                        $(that).height(that.naturalHeight).width(that.naturalWidth);
                    }
                    if (allSlides) {
                        len--;
                        if (len == 0) {
                            callback();
                        }
                    }
                    else {
                        callback();
                    }
                }
                elems.each(function(){
                    var that = this;
                    $(that).on('load error', function () {
                        loadFunction(that);
                    });
                    /*
                     * Start ugly working IE fix.
                     */
                    if (that.readyState == "complete") {
                        $(that).trigger("load");
                    } else if (that.readyState) {
                        // Sometimes IE doesn't fire the readystatechange, even though the readystate has been changed to complete. AARRGHH!! I HATE IE, I HATE IT, I HATE IE!
                        that.src = that.src; // Do not ask me why this works, ask the IE team!
                    }
                    /*
                     * End ugly working IE fix.
                     */
                    else if (that.complete) {
                        $(that).trigger("load");
                    }
                    else if (that.complete === undefined) {
                        var src = that.src;
                        // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
                        // data uri bypasses webkit log warning (thx doug jones)
                        that.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                        that.src = src;
                    }
                });
            }

            function autoadjust(i, speed) {
                i = getRealPos(i); // I assume that the continuous clones, and the original element is the same height. So i always adjust acording to the original element.

                adjustingTo = i;
                adjustTargetTime = getTimeInMillis() + speed;

                if (speed == 0) {
                    finishedAdjustingTo = i;
                } else {
                    finishedAdjustingTo = FALSE;
                }

                // Both autoheight and autowidth can be enabled at the same time. It's a kind of magic.
                if (option[28]/*autoheight*/) autoheightwidth(i, TRUE);//autoheight(i, speed);
                if (option[29]/*autowidth*/) autoheightwidth(i, FALSE);//autowidth(i, speed);
            }

            // Axis: TRUE == height, FALSE == width.
            function autoheightwidth(i, axis) {
                obj.ready(function() {
                    adjustHeightWidth (i, axis);
                    runOnImagesLoaded (li.eq(i), FALSE, function(){
                        adjustHeightWidth (i, axis);
                    });
                });
            }

            function adjustHeightWidth (i, axis) {
                if (i != adjustingTo) {
                    return;
                }
                var pixels = 0;
                for (var slide = i; slide < i + numberOfVisibleSlides; slide++) {
                    var targetPixels = li.eq(getRealPos(slide))['outer' + (axis ? "Height" : "Width")](TRUE);
                    if (axis == option[7]/*vertical*/) {
                        pixels += targetPixels;
                    } else {
                        pixels = mathMax(targetPixels, pixels);
                    }
                }

                var speed = adjustTargetTime - getTimeInMillis();
                speed = mathMax(speed, 0);
                // Doing CSS if speed == 0, 1: its faster. 2: it fixes bugs.
                var adjustObject = axis ? {height: pixels} : {width: pixels};
                if (speed == 0) {
                    obj.stop().css(adjustObject);
                } else {
                    obj.animate(
                        adjustObject,
                        {
                            queue:FALSE,
                            duration:speed,
                            easing:option[12]/*ease*/
                        }
                    );
                }
            }

            function adjustPositionTo(slide) {
                setUlMargins(0,0);

                setUlMargins(
                    getSlidePosition(slide, FALSE),
                    getSlidePosition(slide, TRUE)
                )
            }

            function setUlMargins(left, top) {
                ul.css({
                    marginLeft : left,
                    marginTop : top
                });
            }

            function getSlidePosition(slide, vertical) {
                slide = liConti.eq(slide + (continuousClones ? option[8]/*slidecount*/ : 0));
                return slide.length ? - slide.position()[vertical ? "top" : "left"] : 0;
            }

            function adjust(clicked) {
                autoadjust(t, 0);
                t = getRealPos(t); // Going to the real slide, away from the clone.
                if(!option[30]/*updateBefore*/) setCurrent(t);
                adjustPositionTo(t);
                clickable = TRUE;
                if(option[27]/*history*/ && clicked) win.location.hash = option[19]/*numerictext*/[t];

                if (option[13]/*auto*/) {
                    // Stopping auto if clicked. And also continuing after X seconds of inactivity.
                    if (clicked) {
                        stopAuto();
                        if (option[15]/*resumepause*/) startAuto(option[15]/*resumepause*/);
                    } else {
                        startAuto(option[14]/*pause*/);
                    }
                }

                if (beforeanimationFired) {
                    aniCall(t, TRUE); // I'm not running it at init, if i'm loading the slide.
                }

                if (animateToAfterCompletion !== FALSE) {
                    var animateTo = animateToAfterCompletion;
                    animateToAfterCompletion = FALSE;
                    animateToSlide(animateTo, animateToAfterCompletionClicked);
                }
            }

            // This function is called when i need a callback on the current element and it's continuous clones (if they are there).
            // after:  TRUE == afteranimation : FALSE == beforeanimation;
            function aniCall (i, after, synchronous) {
                i = getRealPos(i);
                var slideElements = getSlideElements(i);
                // Wierd fix to let IE accept the existance of the sudoSlider object.
                var func = function () {
                    (after ? afterAniCall : beforeAniCall)(slideElements, i + 1);
                };
                if (synchronous) {
                    func();
                } else {
                    callAsync(func);
                }
            }

            function afterAniCall(el, a) {
                option[26]/*afteranimation*/.call(el, a);
            }

            function beforeAniCall(el, a) {
                option[25]/*beforeanimation*/.call(el, a);
            }

            function getSlideElements(i) {
                var callBackThis = $();
                for (a in callBackList[i]) {
                    callBackThis = callBackThis.add(callBackList[i][a]);
                }
                return callBackThis;
            }

            // Convert the direction into a usefull number.
            function filterDir(dir) {
                if (dir == NEXT_STRING) {
                    return limitDir(t + option[9]/*movecount*/, dir);
                } else if (dir == PREV_STRING) {
                    return limitDir(t - option[9]/*movecount*/, dir);
                } else if (dir == FIRST_STRING) {
                    return 0;
                } else if (dir == LAST_STRING) {
                    return ts;
                } else {
                    return limitDir(parseInt10(dir), dir);
                }
            }

            // If continuous is off, we sometimes do not want to move to far.
            // This method was added in 2.1.8, se the changelog as to why.
            function limitDir(i, dir) {
                if (option[16]/*continuous*/) {
                    return getRealPos(i);
                } else {
                    var maxSlide = s - numberOfVisibleSlides;
                    if (i > maxSlide) {
                        if (t == maxSlide && dir == NEXT_STRING) {
                            return 0;
                        } else {
                            return maxSlide;
                        }
                    } else if (i < 0) {
                        if (t == 0 && dir == PREV_STRING) {
                            return maxSlide;
                        } else {
                            return 0;
                        }
                    } else {
                        return i;
                    }
                }
            }

            // Load a ajax document (or image) into a slide.
            // If testing this locally (loading everything from a harddisk instead of the internet), it may not work.
            // But then try to upload it to a server, and see it shine.
            function ajaxLoad(i, adjust, speed, ajaxCallBack) {
                if (asyncTimedLoad) clearTimeout(asyncTimedLoad);// I dont want it to run to often.
                var target = option[31]/*ajax*/[i];
                var targetslide = li.eq(i);

                var textloaded = FALSE;

                $.ajax({
                    url: target,
                    success: function(data, textStatus, jqXHR){
                        performAjaxCallback(function () {
                            var type = jqXHR.getResponseHeader('Content-Type');
                            if (type.substr(0,1) != "i") {
                                textloaded = TRUE;
                                targetslide.html(data);
                                ajaxAdjust(i, speed, ajaxCallBack, adjust, FALSE);
                            }
                        });
                    },
                    complete: function(){
                        performAjaxCallback(function () {
                            // Some browsers wont load images this way, so i treat an error as an image.
                            // There is no stable way of determining if it's a real error or if i tried to load an image in a old browser, so i do it this way.
                            if (!textloaded) {
                                // Load the image.
                                image = new Image();
                                targetslide.html('').append(image);
                                image.src = target;
                                // Lets just make some adjustments
                                ajaxAdjust(i, speed, ajaxCallBack, adjust, TRUE);
                            }
                        });
                    }
                });
                // It is loaded, we dont need to do that again.
                option[31]/*ajax*/[i] = FALSE;
                // It is the only option that i need to change for good.
                options.ajax[i] = FALSE;
            }

            // Performs the callback immediately is no animation is running.
            // Otherwise waits for the animation to complete in a FIFO queue.
            function performAjaxCallback(completeFunction) {
                if (currentlyAnimating) {
                    awaitingAjaxLoads.push(completeFunction);
                } else {
                    completeFunction();
                }
            }

            function ajaxAdjust(i, speed, ajaxCallBack, adjust, img){
                var target = li.eq(i);
                var callbackTarget = target;
                // Now to see if the generated content needs to be inserted anywhere else.
                if (continuousClones) {
                    var notFirst = FALSE;
                    for (a in callBackList[i]) {
                        if (notFirst) {
                            var newSlide = target.clone();
                            continuousClones.push(newSlide);
                            callBackList[i][a].replaceWith(newSlide);
                            callBackList[i][a] = newSlide;
                            callbackTarget = callbackTarget.add(newSlide);
                        }
                        notFirst = TRUE;
                    }

                    // The liConti gets messed up a bit in the above code, therefore i fix it.
                    liConti = childrenNotAnimationClones(ul);
                }

                if (adjust || finishedAdjustingTo == i) autoadjust(i, speed);

                // adjustPositionTo();

                runOnImagesLoaded (target, TRUE, function() {
                    if (!currentlyAnimating) adjustPositionTo(t);

                    // And the callback.
                    if (ajaxCallBack) ajaxCallBack();
                    startAsyncDelayedLoad();
                    // If we want, we can launch a function here.
                    option[24]/*ajaxload*/.call(callbackTarget, i + 1, img);

                    if (init) {
                        init = FALSE;
                        callAsync(function () {
                            option[23]/*initCallback*/.call(baseSlider);
                        });
                    }
                });

                // In some cases, i want to call the beforeanimation here.
                if (ajaxCallBack == 2) {
                    aniCall(i, FALSE);
                    if (!beforeanimationFired) {
                        aniCall(i, TRUE);
                        beforeanimationFired = TRUE;
                    }
                }

            }

            function customAni(i, clicked, ajaxcallback) {
                var dir = filterDir(i);

                if (dir != t) {
                    // Just leave the below code as it is, i've allready spent enough time trying to improve it, it allways ended up in me making nothing that worked like it should.
                    ajaxloading = FALSE;

                    if (option[30]/*updateBefore*/) setCurrent(dir);

                    if(option[5]/*controlsfade*/) fadeControls (dir,option[4]/*controlsfadespeed*/);

                    if (ajaxcallback) {
                        speed = oldSpeed;
                        if (dontCountinue) dontCountinue--; // Short for if(dontCountinue == 0).
                    } else if (option[31]/*ajax*/) {
                        // Before i can fade anywhere, i need to load the slides that i'm fading too (needs to be done before the animation, since the animation may include cloning of the target elements.
                        dontCountinue = 0;
                        for (var a = dir; a < dir + numberOfVisibleSlides; a++) {
                            if (option[31]/*ajax*/[a]) {
                                ajaxLoad(getRealPos(a), FALSE, option[1]/*speed*/, function(){
                                    customAni(i, clicked, TRUE);
                                });
                                dontCountinue++;
                            }
                        }
                    } else {
                        dontCountinue = FALSE;
                    }
                    if (!dontCountinue) {
                        clickable = FALSE;
                        var fromSlides = $();
                        var toSlides = $();
                        for (var a = 0 ; a < numberOfVisibleSlides; a++) {
                            if (continuousClones) {
                                fromSlides = fromSlides.add(liConti.eq((t + a) + (continuousClones ? option[8]/*slidecount*/ : 0)));
                                toSlides = toSlides.add(liConti.eq((dir + a) + (continuousClones ? option[8]/*slidecount*/ : 0)));
                            } else {
                                fromSlides = fromSlides.add(getSlideElements(getRealPos(t + a)));
                                toSlides = toSlides.add(getSlideElements(getRealPos(dir + a)));
                            }
                        }


                        // Finding a "shortcut", used for calculating the offsets.
                        var diff = -(t-dir);
                        if (option[16]/*continuous*/) {
                            var diffAbs = mathAbs(diff);
                            i = dir;
                            // Finding the shortest path from where we are to where we are going.
                            var newDiff = -(t - dir - s) /* t - (realTarget + s) */;
                            if (dir < option[8]/*slidecount*/ - numberOfVisibleSlides + 1 && mathAbs(newDiff) < diffAbs) {
                                i = dir + s;
                                diff = newDiff;
                                diffAbs = mathAbs(diff);
                            }
                            newDiff = -(t - dir + s)/* t - (realTarget - s) */;
                            if (dir > ts - option[8]/*slidecount*/ && mathAbs(newDiff)  < diffAbs) {
                                i = dir - s;
                                diff = newDiff;
                            }
                        } else {
                            i = filterDir(i);
                        }

                        var leftTarget = getSlidePosition(i, FALSE);
                        var topTarget = getSlidePosition(i, TRUE);

                        var targetLi = li.eq(dir);
                        var callOptions = $.extend(TRUE, {}, options); // Making a copy, to enforce read-only.
                        var attributeSpeed = targetLi.attr("data-speed");
                        if (attributeSpeed != undefined) {
                            callOptions.speed = attributeSpeed;
                        }

                        var effect = option[0]/*effect*/;

                        var specificEffectAttrName = "data-effect";
                        var slideSpecificEffect = targetLi.attr(specificEffectAttrName);
                        if (slideSpecificEffect) {
                            effect = getEffectMethod(slideSpecificEffect);
                        }
                        var slideOutSpecificEffect = li.eq(t).attr(specificEffectAttrName + "out");
                        if (slideOutSpecificEffect) {
                            effect = getEffectMethod(slideOutSpecificEffect);
                        }

                        currentlyAnimating = TRUE;
                        currentAnimation = effect;

                        var callbackHasYetToRun = TRUE;
                        currentAnimationCallback = function () {
                            // Just being sure that this thing ONLY run once.
                            if (callbackHasYetToRun) {
                                currentlyAnimating = FALSE;
                                callbackHasYetToRun = FALSE;
                                goToSlide(dir, clicked);
                                fixClearType(toSlides);

                                // afteranimation
                                aniCall(dir, TRUE);

                                while (awaitingAjaxLoads.length) {
                                    // Removing and running the first, so we maintain FIFO.
                                    awaitingAjaxLoads.splice(0,1)[0]();
                                }
                            }
                        };
                        var callObject = {
                            fromSlides : fromSlides,
                            toSlides : toSlides,
                            slider : obj,
                            options: callOptions,
                            to: dir + 1,
                            from: t + 1,
                            diff: diff,
                            target: {
                                left: leftTarget,
                                top: topTarget
                            },
                            callback: stopAnimation,
                            goToNext: function () {
                                adjustPositionTo(dir);
                            }
                        };

                        autoadjust(dir, option[1]/*speed*/);

                        callAsync(function () {
                            // beforeanimation
                            aniCall(dir, FALSE, TRUE);

                            effect.call(baseSlider, callObject);
                        });
                    }
                }
            }

            function stopAnimation() {
                if (currentlyAnimating) {
                    // Doing it in this order isn't a problem in relation to the user-callbacks, since they are run in a setTimeout(callback, 0) anyway.
                    currentAnimationCallback();

                    var stopFunction = currentAnimation.stop;
                    if (stopFunction) {
                        stopFunction();
                    } else {
                        defaultStopFunction();
                    }
                }
            }

            function defaultStopFunction() {
                $("." + ANIMATION_CLONE_MARKER_CLASS, obj).remove();
                ul.stop();
            }

            function goToSlide(slide, clicked) {
                clickable = !clicked && !option[13]/*auto*/;
                ot = t;
                t = slide;

                ul.css({marginTop: getSlidePosition(t, TRUE), marginLeft: getSlidePosition(t, FALSE)});

                adjust(clicked);

                if(option[5]/*controlsfade*/) {
                    var fadetime = option[4]/*controlsfadespeed*/;
                    if (init) fadetime = 0;
                    fadeControls (t,fadetime);
                }
                if (init && !option[31]/*ajax*/[t]) {
                    init = FALSE;
                    callAsync(function () {
                        option[23]/*initCallback*/.call(baseSlider);
                    });
                }
            }

            function getRealPos(a) {
                // Fixes an infinite loop if there are 0 slides in the slider.
                if (s == 0) {
                    return 0;
                }
                var position = parseInt10(a);
                while (position < 0) {
                    position += s;
                }
                return position % s;
            }

            function fixClearType (element) {
                if (screen.fontSmoothingEnabled && element.style) element.style.removeAttribute("filter"); // Fix cleartype
            }

            /*
             * Public methods.
             */

            // First i just define those i use more than one. Then i just add the others as anonymous functions.
            function publicDestroy() {
                stopAnimation();
                destroyed = TRUE;
                destroyT = t;

                if (option[11]/*responsive*/) {
                    $(win).off("resize focus", adjustResponsiveLayout);
                }

                if (controls) {
                    controls.remove();
                }

                $(option[2]/*customlink*/).off("click");

                if (continuousClones) {
                    for (var i = 0; i < continuousClones.length; i++) {
                        continuousClones[i].remove();
                    }
                }

                adjustPositionTo(t);
            }

            baseSlider.destroy = publicDestroy;

            function publicInit(){
                if (destroyed) {
                    initSudoSlider(destroyT);
                }
            }

            baseSlider.init = publicInit;

            baseSlider.getOption = function(a){
                return options[a.toLowerCase()];
            };

            baseSlider.setOption = function(a, val){
                publicDestroy();
                options[a.toLowerCase()] = val;
                publicInit();
            };

            baseSlider.insertSlide = function (html, pos, numtext, goToSlide) {
                publicDestroy();
                // pos = 0 means before everything else.
                // pos = 1 means after the first slide.
                if (pos > s) pos = s;
                html = '<li>' + html + '</li>';
                if (!pos || pos == 0) ul.prepend(html);
                else li.eq(pos -1).after(html);
                // Finally, we make it work again.
                if (goToSlide) {
                    destroyT = goToSlide - 1;
                } else if (pos <= destroyT || (!pos || pos == 0)) {
                    destroyT++;
                }

                if (option[19]/*numerictext*/.length < pos){
                    option[19]/*numerictext*/.length = pos;
                }

                option[19]/*numerictext*/.splice(pos,0,numtext || parseInt10(pos)+1);
                publicInit();
            };

            baseSlider.removeSlide = function(pos){
                pos--; // 1 == the first.
                publicDestroy();

                li.eq(pos).remove();
                option[19]/*numerictext*/.splice(pos,1);
                if (pos < destroyT){
                    destroyT--;
                }

                publicInit();
            };

            baseSlider.goToSlide = function(a){
                animateToSlide((a == parseInt10(a)) ? a - 1 : a, TRUE);
            };

            baseSlider.block = function(){
                clickable = FALSE;
            };

            baseSlider.unblock = function(){
                clickable = TRUE;
            };

            baseSlider.startAuto = function(){
                option[13]/*auto*/ = TRUE;
                startAuto(option[14]/*pause*/);
            };

            baseSlider.stopAuto = function(){
                option[13]/*auto*/ = FALSE;
                stopAuto();
            };

            baseSlider.adjust = function(){
                var autoAdjustSpeed = adjustTargetTime - getTimeInMillis();
                autoadjust(t, autoAdjustSpeed);
                if (!currentlyAnimating) {
                    adjustPositionTo(t);
                }
            };

            baseSlider.getValue = function(a){
                return {
                    currentslide: t + 1,
                    totalslides : s,
                    clickable: clickable,
                    destroyed: destroyed,
                    autoanimation: autoOn
                }[a.toLowerCase()];
            };

            baseSlider.getSlide = function (number) {
                number = getRealPos(parseInt10(number) - 1);
                return getSlideElements(number);
            };

            baseSlider.stopAnimation = stopAnimation;

            // Done, now initialize.
            initSudoSlider();
        });
    };
    /*
     * End generic slider. Start animations.
     * A lot of the code here is an if-else-elseif nightmare. This is because it is smaller in JavaScript, and this thing needs to be small (when minimized).
     */

    // Start by defining everything, the implementations are below.
    var normalEffectsPrefixObject = {
        box: {
            Random: [
                "",
                "GrowIn",
                "GrowOut",
                boxRandomTemplate
            ],
            Rain: [
                "",
                "GrowIn",
                "GrowOut",
                "FlyIn",
                "FlyOut",
                [
                    "UpLeft",
                    "DownLeft",
                    "DownRight",
                    "UpRight",
                    boxRainTemplate
                ]
            ],
            Spiral: [
                "InWards",
                "OutWards",
                {
                    "": boxSpiralTemplate,
                    Grow: [
                        "In",
                        "Out",
                        boxSpiralGrowTemplate
                    ]
                }
            ]
        },
        fade: {
            "": fade,
            OutIn: fadeOutIn
        },
        foldRandom: [
            "Horizontal",
            "Vertical",
            foldRandom
        ],
        slide : slide
    }

    // Generic effects needs to have a "dir" attribute as their last argument.
    var genericEffectsPrefixObject = {
        blinds : {
            "1": blinds1,
            "2": blinds2
        },
        fold: fold,
        push: pushTemplate,
        reveal: revealTemplate,
        slice: {
            "": [
                "",
                "Reverse",
                slice
            ],
            Reveal: [
                "",
                "Reverse",
                sliceReveal
            ],
            Random: [
                "",
                "Reveal",
                slicesRandom
            ],
            Fade: slicesFade
        },
        zip: zip,
        unzip: unzip
    }



    function parsePrefixedEffects (resultObject, effectsObject, prefix, generic, argumentsStack) {
        if (isFunction(effectsObject)) {
            if (generic) {
                // Parsing the value 0, as a hack to make generic effects work, see the below else case.
                parsePrefixedEffects(resultObject, ["", "Up", "Right", "Down", "Left", effectsObject], prefix, 0, argumentsStack);
            } else {
                resultObject[prefix] = function (obj) {
                    var argumentArray = [obj].concat(argumentsStack);

                    // Ugly hack, to make "generic" functions to work.
                    var genericArgumentIndex = (argumentArray.length - 1);
                    if (generic === 0 && argumentArray[genericArgumentIndex] == 0) {
                        argumentArray[genericArgumentIndex] = getDirFromAnimationObject(obj);
                    }

                    effectsObject.apply(this, argumentArray);
                }
            }
        } else if (isArray(effectsObject)) {
            var effectIndex = effectsObject.length - 1;
            var effect = effectsObject[effectIndex];
            for (var i = 0; i < effectIndex; i++) {
                var newArgumentStack = cloneArray(argumentsStack);
                newArgumentStack.push(i);
                var name = effectsObject[i];
                parsePrefixedEffects(resultObject, effect, prefix + name, generic, newArgumentStack);
            }
        } else {
            $.each(effectsObject, function (name, effect) {
                parsePrefixedEffects(resultObject, effect, prefix + name, generic, argumentsStack);
            });
        }
    }


    var allEffects = {};
    parsePrefixedEffects(allEffects, genericEffectsPrefixObject, "", TRUE, []);
    parsePrefixedEffects(allEffects, normalEffectsPrefixObject, "", FALSE, []);

    var randomEffects = {
        random: function (obj) {
            var effectFunction = pickRandomValue(allEffects);
            return effectFunction(obj);
        }
    };

    // Saving it
    $.fn.sudoSlider.effects = mergeObjects(allEffects, randomEffects);

    // The implementations
    // TODO: Make sure easing is used everywhere it should.
    // dir: 0: UpRight, 1: DownRight: 2: DownLeft, 3: UpLeft
    // effect: 0: none, 1: growIn, 2: growOut, 3: flyIn, 4: flyOut.
    function boxRainTemplate(obj, effect, dir) {
        var reverseRows = dir == 1 || dir == 3;
        var reverse = dir == 0 || dir == 3;
        var grow = effect == 1 || effect == 2;
        var flyIn = effect == 3 || effect == 4;
        var reveal = effect == 4 || effect == 2;
        boxTemplate(obj, reverse, reverseRows, grow, FALSE, 1, flyIn, reveal);
    }

    function boxSpiralTemplate(obj, direction) {
        boxTemplate(obj, direction, FALSE, FALSE, FALSE, 2, FALSE, FALSE);
    }

    function boxSpiralGrowTemplate(obj, direction, reveal) {
        boxTemplate(obj, direction, FALSE, TRUE, FALSE, 2, FALSE, reveal);
    }

    // grow: 0: no grow, 1: growIn, 2: growOut
    function boxRandomTemplate(obj, grow) {
        var reveal = grow == 2;
        boxTemplate(obj, FALSE, FALSE, grow, TRUE, 0, FALSE, reveal);
    }

    // SelectionAlgorithm: 0: Standard selection, 1: rain, 2: spiral
    function boxTemplate(obj, reverse, reverseRows, grow, randomize, selectionAlgorithm, flyIn, reveal) {
        var options = obj.options;
        var speed = options.speed;
        var boxRows = options.boxrows;
        var boxCols = options.boxcols;
        var totalBoxes = boxRows * boxCols;
        var boxes = createBoxes(obj, boxCols, boxRows, !reveal);
        var timeBuff = 0;
        var rowIndex = 0;
        var colIndex = 0;
        var box2DArr = [];
        box2DArr[rowIndex] = [];
        if (reverse) {
            reverseArray(boxes);
        }
        if (randomize) {
            boxes = shuffle(boxes);
        }


        boxes.each(function () {
            box2DArr[rowIndex][colIndex] = this;
            colIndex++;
            if (colIndex == boxCols) {
                if (reverseRows) {
                    reverseArray(box2DArr[rowIndex]);
                }
                rowIndex++;
                colIndex = 0;
                box2DArr[rowIndex] = [];
            }
        });

        var boxesResult = [];
        if (selectionAlgorithm == 1) {
            // Rain
            for (var cols = 0; cols < (boxCols * 2) + 1; cols++) {
                var prevCol = cols;
                var boxesResultLine = [];
                for (var rows = 0; rows < boxRows; rows++) {
                    if (prevCol >= 0 && prevCol < boxCols) {
                        var rawBox = box2DArr[rows][prevCol];
                        if (!rawBox) {
                            return;
                        }
                        boxesResultLine.push(rawBox);
                    }
                    prevCol--;
                }
                if (boxesResultLine.length != 0) {
                    boxesResult.push(boxesResultLine);
                }
            }
        } else if (selectionAlgorithm == 2) {
            // Spiral
            // Algorithm borrowed from the Camera plugin by Pixedelic.com
            var rows2 = boxRows/2, x, y, z, n= reverse ? totalBoxes : -1;
            var negative = reverse ? -1 : 1;
            for (z = 0; z < rows2; z++){
                y = z;
                for (x = z; x < boxCols - z - 1; x++) {
                    boxesResult[n += negative] = boxes.eq(y * boxCols + x);
                }
                x = boxCols - z - 1;
                for (y = z; y < boxRows - z - 1; y++) {
                    boxesResult[n += negative] = boxes.eq(y * boxCols + x);
                }
                y = boxRows - z - 1;
                for (x = boxCols - z - 1; x > z; x--) {
                    boxesResult[n += negative] = boxes.eq(y * boxCols + x);
                }
                x = z;
                for (y = boxRows - z - 1; y > z; y--) {
                    boxesResult[n += negative] = boxes.eq(y * boxCols + x);
                }
            }
        } else {
            for (var row = 0; row < boxRows; row++) {
                for (var col = 0; col < boxCols; col++) {
                    boxesResult.push([box2DArr[row][col]]);
                }
            }
        }

        if (reveal) {
            obj.goToNext();
        }

        var count = 0;
        for (var i = 0; i < boxesResult.length; i++) {
            var boxLine = boxesResult[i];
            for (var j = 0; j < boxLine.length; j++) {
                var box = $(boxLine[j]);
                (function (box, timeBuff) {
                    var goToWidth = box.width();
                    var goToHeight = box.height();

                    if (flyIn) {
                        var orgLeft = parseNumber(box.css("left"));
                        var orgTop = parseNumber(box.css("top"));

                        var adjustLeft = reverse != reverseRows ? -goToWidth : goToWidth;
                        var adjustTop = reverse ? - goToHeight : goToHeight;

                        if (reveal) {
                            adjustLeft *= 1;
                            orgLeft -= adjustLeft;

                            adjustTop *= 1;
                            orgTop -= adjustTop;
                        }

                        box.css({left: orgLeft + adjustLeft, top: orgTop + adjustTop});
                    }

                    // This part makes so that the boxGrow animations appears to originate from the center of the box, instead of the top-left corner.
                    var goToMarginLeft = 0;
                    var goToMarginTop = 0;
                    var boxChildren = box.children();
                    if (grow) {
                        if (!reveal) {
                            box.css({marginLeft: goToWidth / 2, marginTop: goToHeight / 2});
                            boxChildren.css({marginLeft: -goToWidth / 2, marginTop: -goToHeight / 2});
                        } else {
                            goToMarginLeft = goToWidth / 2;
                            goToMarginTop = goToHeight / 2;
                        }
                    }

                    if (grow) {
                        if (reveal) {
                            goToHeight = goToWidth = 0;
                        } else {
                            box.width(0).height(0);
                        }
                    }
                    if (reveal) {
                        box.css({opacity: 1});
                    }
                    count++;
                    setTimeout(function () {
                        boxChildren.animate({marginLeft: -goToMarginLeft, marginTop: -goToMarginTop}, speed);
                        box.animate({
                            opacity: reveal ? 0 : 1,
                            width: goToWidth,
                            height: goToHeight,
                            left: orgLeft,
                            top: orgTop,
                            marginLeft: goToMarginLeft,
                            marginTop: goToMarginTop
                        }, speed, function () {
                            count--;
                            if (count == 0) {
                                obj.callback();
                            }
                        });
                    }, timeBuff);
                })(box, timeBuff);
            }
            timeBuff += (speed / boxesResult.length) * 2;
        }
    }

    function slicesFade(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, negative, FALSE, TRUE);
    }

    function fold(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, negative);
    }

    function foldRandom(obj, vertical) {
        foldTemplate(obj, vertical, FALSE, TRUE);
    }

    function blinds1(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, negative, FALSE, FALSE, 1);
    }

    function blinds2(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, negative, FALSE, FALSE, 2);
    }

    function slice(obj, reverse, dir) {
        var vertical = dir == 1 || dir == 3;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, reverse, FALSE, FALSE, 0, negative ? 1 : 2);
    }

    function sliceReveal(obj, reverse, dir) {
        var vertical = dir == 1 || dir == 3;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, reverse, FALSE, FALSE, 0, negative ? 1 : 2, TRUE);
    }

    function zip(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, negative, FALSE, FALSE, 0, 3);
    }

    function unzip(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, negative, FALSE, FALSE, 0, 3, TRUE);
    }

    function slicesRandom(obj, reveal, dir) {
        var vertical = dir == 1 || dir == 3;
        var negative = dir == 1 || dir == 4;
        foldTemplate(obj, vertical, FALSE, TRUE, FALSE, 0, negative ? 1 : 2, reveal);
    }

    function foldTemplate(obj, vertical, reverse, randomize, onlyFade, curtainEffect, upDownEffect, reveal) {
        var options = obj.options;
        var slides = options.slices;
        var speed = options.speed;
        var ease = options.ease;
        var objSlider = obj.slider;
        var slicesElement = createBoxes(obj, vertical ? slides : 1, vertical ? 1 : slides, !reveal);
        var count = 0;
        var upDownAlternator = FALSE;
        if (reverse) {
            reverseArray(slicesElement);
        } else {
            $(reverseArray(slicesElement.get())).appendTo(objSlider);
        }
        if (randomize) {
            slicesElement = shuffle(slicesElement);
        }
        slicesElement.each(function (i) {
            var timeBuff = ((speed / slides) * i);
            var slice = $(this);
            var orgWidth = slice.width();
            var orgHeight = slice.height();
            var goToLeft = slice.css("left");
            var goToTop = slice.css("top");
            var startPosition = vertical ? goToLeft : goToTop;

            var innerBox = slice.children();
            var startAdjustment = innerBox[vertical ? "width" : "height"]();
            if (curtainEffect == 1) {
                startPosition = 0
            } else if (curtainEffect == 2) {
                startPosition = startAdjustment / 2;
            }
            if (reverse) {
                startPosition = startAdjustment - startPosition;
            }
            if (vertical) {
                slice.css({
                    width: (onlyFade || upDownEffect ? orgWidth : 0),
                    left: startPosition
                });
            } else {
                slice.css({
                    height: (onlyFade || upDownEffect ? orgHeight : 0),
                    top: startPosition
                });
            }

            if (reveal) {
                var negative = upDownEffect == 1 ? -1 : 1;
                obj.goToNext();
                slice.css({
                    top: goToTop,
                    left: goToLeft,
                    width: orgWidth,
                    height: orgHeight,
                    opacity: 1
                });
                if (vertical) {
                    goToTop = negative * orgHeight;
                } else {
                    goToLeft = negative * orgWidth;
                }
            }

            if (upDownEffect) {
                var bottom = TRUE;
                if (upDownEffect == 3) {
                    if (upDownAlternator) {
                        bottom = FALSE;
                        upDownAlternator = FALSE;
                    } else {
                        upDownAlternator = TRUE;
                    }
                } else if (upDownEffect == 2) {
                    bottom = FALSE;
                }
                if (vertical) {
                    if (reveal) {
                        goToTop = (bottom ? -1 : 1) * orgHeight;
                    } else {
                        slice.css({
                            bottom: bottom ? 0 : orgHeight,
                            top: bottom ? orgHeight : 0,
                            height: reveal ? orgHeight : 0
                        });
                    }
                } else {
                    if (reveal) {
                        goToLeft = (bottom ? -1 : 1) * orgWidth;
                    } else {
                        slice.css({
                            right: bottom ? 0 : orgWidth,
                            left: bottom ? orgWidth : 0,
                            width: reveal ? orgWidth : 0
                        });
                    }
                }
            }



            count++;
            setTimeout(function () {
                slice.animate({
                    width: orgWidth,
                    height: orgHeight,
                    opacity: 1,
                    left: goToLeft,
                    top: goToTop
                }, speed, ease, function () {
                    count--;
                    if (count == 0) {
                        obj.callback();
                    }
                });
            }, timeBuff);
        });
    }

    // 1: up, 2: right, 3: down, 4, left:
    function pushTemplate(obj, dir) {
        var vertical = dir == 2 || dir == 4;
        var negative = (dir == 2 || dir == 3) ? -1 : 1;
        var options = obj.options;
        var ease = options.ease;
        var fromSlides = obj.fromSlides;
        var clone = makeClone(obj, TRUE);
        clone.prependTo(obj.slider);
        var height = mathMax(clone.height(), fromSlides.height());
        var width = mathMax(clone.width(), fromSlides.width());
        var speed = options.speed;
        clone.css(
                vertical ? {left: negative * width} : {top: negative * height}
            ).animate(
            {left: 0, top: 0}, speed, ease, function () {
                obj.callback();
            }
        );
    }

    function revealTemplate(obj, dir) {
        var vertical = dir == 1 || dir == 3;
        var options = obj.options;
        var ease = options.ease;
        var speed = options.speed;
        var innerBox = makeClone(obj, TRUE);
        var width = innerBox.width();
        var height = innerBox.height();
        var box = makeBox(innerBox, 0, 0, 0, 0, obj)
            .css({opacity: 1})
            .appendTo(obj.slider);
        if (vertical) {
            box.css({width: width});
            if (dir == 1) {
                innerBox.css({top: - height});
                box.css({bottom: 0, top: "auto"});
            }
        } else {
            box.css({height: height});
            if (dir == 4) {
                innerBox.css({left: - width});
                box.css({right: 0, left: "auto"});
            }
        }
        innerBox.animate({left: 0, top: 0}, speed, ease);
        box.animate({width: width, height: height}, speed, ease, function () {
            obj.callback();
        });
    }

    function slide(obj) {
        var ul = obj.slider.children();
        var options = obj.options;
        var ease = options.ease;
        var speed = options.speed * Math.sqrt(mathAbs(obj.diff));
        var target = obj.target;
        var left = target.left;
        var top = target.top;

        ul.animate(
            { marginTop: top, marginLeft: left},
            {
                queue:FALSE,
                duration:speed,
                easing: ease,
                complete: obj.callback
            }
        );
    }

    function fadeOutIn(obj) {
        var options = obj.options;
        var fadeSpeed = options.speed;
        var ease = options.ease;

        var fadeinspeed = parseInt(fadeSpeed*(3/5), 10);
        var fadeoutspeed = fadeSpeed - fadeinspeed;

        var orgCallback = obj.callback;
        obj.callback = function () {
            obj.fromSlides.animate({opacity: 1}, 0);
            orgCallback();
        };

        obj.fromSlides.animate(
            { opacity: 0.0001 },
            {
                queue: FALSE,
                duration:fadeoutspeed,
                easing:ease,
                complete:function () {
                    finishFadeAnimation(obj, fadeSpeed);
                }
            }
        );
    }


    function fade(obj) {
        finishFadeAnimation(obj, obj.options.speed);
    }

    function finishFadeAnimation(obj, speed) {
        var options = obj.options;
        options.boxcols = 1;
        options.boxrows = 1;
        options.speed = speed;
        boxTemplate(obj);
    }

    function getDirFromAnimationObject(obj) {
        var vertical = obj.options.vertical;
        var diff = obj.diff;
        var dir;
        if (vertical) {
            if (diff < 0) {
                dir = 1;
            } else {
                dir = 3;
            }
        } else {
            if (diff < 0) {
                dir = 2;
            } else {
                dir = 4;
            }
        }
        return dir;
    }


    function createBoxes(obj, numberOfCols, numberOfRows, useToSlides) {
        var slider = obj.slider;
        var result = $();
        var boxWidth, boxHeight, adjustedBoxWidth, adjustBoxHeight;
        var first = TRUE;
        for (var rows = 0; rows < numberOfRows; rows++) {
            for (var cols = 0; cols < numberOfCols; cols++) {
                var innerBox = makeClone(obj, useToSlides);

                if (first) {
                    first = FALSE;
                    boxWidth = innerBox.width() / numberOfCols;
                    boxHeight = innerBox.height() / numberOfRows;
                    adjustedBoxWidth = Math.ceil(boxWidth);
                    adjustBoxHeight = Math.ceil(boxHeight);
                }

                var boxWidthToUse;
                if (cols == numberOfCols - 1) {
                    boxWidthToUse = (slider.width() - (boxWidth * cols));
                } else {
                    boxWidthToUse = adjustedBoxWidth;
                }
                var box = makeBox(
                    innerBox, // innerBox
                    boxHeight * rows, // top
                    boxWidth * cols, // left
                    adjustBoxHeight, // height
                    boxWidthToUse, // width
                    obj // for options.
                );
                slider.append(box);
                result = result.add(box);
            }
        }
        return result;
    }

    function makeBox(innerBox, top, left, height, width, obj) {
        innerBox.css({
            width: innerBox.width(),
            height: innerBox.height(),
            display: "block",
            top: - top,
            left: - left
        });
        var box = $('<div>').css({
            left: left,
            top: top,
            width: width,
            height: height,
            opacity:0,
            overflow: "hidden",
            position: ABSOLUTE_STRING,
            zIndex: obj.options.animationzindex
        });
        box.append(innerBox).addClass(ANIMATION_CLONE_MARKER_CLASS);
        return box;
    }

    // Makes a single box that contains clones of the toSlides. Positioned correctly relative to each other. And the returned box has the correct height and width.
    function makeClone(obj, useToSlides) {
        var toSlides = useToSlides ? obj.toSlides : obj.fromSlides;
        var firstSlidePosition = toSlides.eq(0).position();
        var orgLeft = firstSlidePosition.left;
        var orgTop = firstSlidePosition.top;
        var height = 0;
        var width = 0;
        var result = $("<div>").css({zIndex : obj.options.animationzindex, position : ABSOLUTE_STRING, top : 0, left : 0}).addClass(ANIMATION_CLONE_MARKER_CLASS);
        toSlides.each(function () {
            var that = $(this);
            var cloneWidth = that.outerWidth(true);
            var cloneHeight = that.outerHeight(true);
            var clone = that.clone();
            var position = that.position();
            var left = position.left - orgLeft;
            var top = position.top - orgTop;
            clone.css({position : ABSOLUTE_STRING, left: left, top: top, opacity: 1});
            height = mathMax(height, top + cloneHeight);
            width = mathMax(width, left + cloneWidth);
            result.append(clone);
        });
        result.width(width).height(height);
        return result;
    }


    /*
     * Util scripts.
     */
    // Puts the specified function in a setTimeout([function], 0);
    function callAsync(func) {
        setTimeout(func, 0);
    }

    function cloneArray(arrayToClone) {
        return arrayToClone.slice();
    }

    // This mutates the given array, so that it is reversed.
    // It also returns it.
    function reverseArray(array) {
        return [].reverse.call(array);
    }

    function childrenNotAnimationClones(obj) {
        return obj.children().not("."+ANIMATION_CLONE_MARKER_CLASS);
    }

    function objectToLowercase (obj) {
        var ret = {};
        for (var key in obj)
            ret[key.toLowerCase()] = obj[key];
        return ret;
    }

    function shuffle(array) {
        for (var j, x, i = array.length; i; j = parseInt(Math.random() * i), x = array[--i], array[i] = array[j], array[j] = x){}
        return array;
    }

    function isFunction(func) {
        return $.isFunction(func);
    }

    function isArray(object) {
        return $.isArray(object);
    }

    function parseInt10(num) {
        return parseInt(num, 10);
    }

    function parseNumber(num) {
        return parseFloat(num);
    }

    function getTimeInMillis() {
        return +new Date();
    }

    function mathAbs(number) {
        return number < 0 ? - number : number;
    }

    function mathMax(a, b) {
        return a > b ? a : b;
    }

    function mergeObjects(){
        var result = {};
        var args = arguments;
        for (var i = 0; i < args.length; i++) {
            var obj = args[i];
            for (var attrname in obj) {
                result[attrname] = obj[attrname];
            }
        }
        return result;
    }

    function pickRandomValue(obj) {
        var result;
        var count = 0;
        for (var prop in obj)
            if (Math.random() < 1/++count)
                result = prop;
        return obj[result];
    }

})(jQuery, window);
// If you did just read the entire code, congrats.
// Did you find a bug? I didn't, so plz tell me if you did. (https://github.com/webbiesdk/SudoSlider/issues)