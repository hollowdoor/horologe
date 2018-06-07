var horologe = (function () {
    'use strict';

    //Most for use with gyre
    /*
    git remote add origin https://github.com/hollowdoor/more_events.git
    git push -u origin master
    */
    function MoreEvents(context){
        this.listeners = {};
        this.__context = context || this;
    }

    MoreEvents.prototype = {
        constructor: MoreEvents,
        on: function(event, listener){
            this.listeners[event] = this.listeners[event] || [];
            this.listeners[event].push(listener);
            return this;
        },
        one: function(event, listener){
            function onceListener(){
                listener.apply(this, arguments);
                this.off(event, onceListener);
                return this;
            }
            return this.on(event, onceListener);
        },
        emit: function(event){
            var this$1 = this;

            if(typeof this.listeners[event] === 'undefined' || !this.listeners[event].length)
                { return this; }

            var args = Array.prototype.slice.call(arguments, 1),
                canRun = this.listeners[event].length;

            do{
                this$1.listeners[event][--canRun].apply(this$1.__context, args);
            }while(canRun);

            return this;
        },
        off: function(event, listener){
            if(this.listeners[event] === undefined || !this.listeners[event].length)
                { return this; }
            this.listeners[event] = this.listeners[event].filter(function(item){
                return item !== listener;
            });
            return this;
        },
        dispose: function(){
            var this$1 = this;

            for(var n in this$1){
                this$1[n] = null;
            }
        }
    };

    var Emitter = MoreEvents;

    var getNow = Date.now !== void 0
    ? Date.now
    : function (){ return new Date().getTime(); };

    var makeNow = function (highres){
        if(!highres) { return getNow; }

        var bind = !Function.prototype.bind
        ? function (f, c){ return function (){
            var a = [], len = arguments.length;
            while ( len-- ) a[ len ] = arguments[ len ];

            return f.apply(c, a);
     }        }
        : function (f, c){ return f.bind(c); };

        var perfNow = bind((function() {
          return performance.now       ||
                 performance.mozNow    ||
                 performance.msNow     ||
                 performance.oNow      ||
                 performance.webkitNow ||
                 function() { return getNow(); };
        })(), performance);

        var navstart = performance.timing.navigationStart;

        return function (){
            return navstart + perfNow();
        };
    };



    var Timer = (function (Emitter$$1) {
        function Timer(interval, ref){
            var this$1 = this;
            if ( interval === void 0 ) interval = 1000;
            if ( ref === void 0 ) ref = {};
            var sync = ref.sync; if ( sync === void 0 ) sync = 1000;
            var tick = ref.tick; if ( tick === void 0 ) tick = null;
            var highres = ref.highres; if ( highres === void 0 ) highres = false;
            var skip = ref.skip; if ( skip === void 0 ) skip = true;
            var name = ref.name; if ( name === void 0 ) name = '';


            Emitter$$1.call(this);

            var now = makeNow(highres);

            var timeoutId = null,
                running = false,
                paused = false,
                count = 0,
                timeRange = Infinity,
                startTime = now(),
                pauseCount = 0,
                pauseLimit = Infinity;


            if(typeof tick === 'function'){
                this.on('tick', tick);
            }

            Object.defineProperties(this, {
                interval: {get: function get(){ return interval; }},
                paused: {get: function get(){ return paused; }},
                running: {get: function get(){ return running; }},
                count: {get: function get(){ return count; }},
                percent: {get: function get(){
                    return ~~((count - pauseCount * interval / interval) / (timeRange / interval) * 100 + 0.5);
                }},
                startTime: {get: function get(){ return startTime; }},
                name: { value: name }
            });

            var interrupt = function (){
                clearTimeout(timeoutId);
                timeoutId = null;
                running = false;
            };

            var ready = function (startTime, next, mil){
                paused = false;
                running = true;
                timeoutId = setTimeout(next, mil);
                this$1.emit('start', startTime);
            };

            var next = function (){
                if(!running) { return; }

                var time = now();
                //The less accurate diffing
                //var diff = (time - startTime) % interval;
                var diff = (time - startTime) - (++count * interval);

                time = time - diff;

                var passed = (time - startTime) - pauseCount * interval;

                timeoutId = setTimeout(next, interval - diff);

                if(!paused){
                    this$1.emit('tick', time, passed, diff);
                }else{
                    ++pauseCount;
                    if((pauseCount + 1) * interval > pauseLimit){
                        this$1.start();
                    }
                }

                if(time > startTime + timeRange + pauseCount * interval){
                    this$1.emit('complete', time, passed);
                    this$1.stop();
                }
            };

            function stop(){
                count = 0;
                paused = false;
                pauseCount = 0;
                startTime = null;
                interrupt();
                this.emit('stop');
                return this;
            }

            function pause(limit){
                if ( limit === void 0 ) limit = Infinity;

                paused = true;
                pauseLimit = limit;
                this.emit('pause');
                return this;
            }

            function range(r){
                if(r === undefined){
                    return timeRange;
                }
                timeRange = r;
                return this;
            }

            function start(wait){
                if ( wait === void 0 ) wait = 0;

                var i = interval;

                if(!paused && running){
                    return this;
                }

                if(wait){
                    i = wait;

                    if(!paused){
                        startTime = now();

                        if(sync){
                            var diff = startTime % sync;
                            var round = wait < interval
                            ? 0 : interval;

                            startTime = startTime - diff + round;
                        }
                    }
                }else if(!paused){
                    startTime = now();

                    if(sync){
                        var diff$1 = startTime % sync;
                        var round$1 = diff$1 < interval / 2
                        ? 0 : interval;

                        startTime = startTime - diff$1 + round$1;

                        i = diff$1 + round$1;
                    }
                }

                ready(startTime, next, i);
                return this;
            }

            /*function start(wait = 0){

                if(!paused){
                    startTime = now();
                }

                if(sync){
                    let original = startTime;
                    let startInterval = wait ? wait : interval;



                    if(!paused){
                        let diff = startTime % sync;
                        startTime = startTime - diff + wait;
                        startInterval = wait
                        ? wait
                        : interval - diff + interval;
                    }

                    console.log('original ',original)
                    console.log('startTime ',startTime)
                    console.log('startInterval ',startInterval)

                    ready(startTime, next, startInterval);
                    return this;
                }

                ready(startTime, next, interval + wait);
                return this;
            }*/

            this.stop = stop;
            this.pause = pause;
            this.range = range;
            this.start = start;
        }

        if ( Emitter$$1 ) Timer.__proto__ = Emitter$$1;
        Timer.prototype = Object.create( Emitter$$1 && Emitter$$1.prototype );
        Timer.prototype.constructor = Timer;
        Timer.prototype.dispose = function dispose (){
            var this$1 = this;

            Emitter$$1.prototype.dispose.call(this);
            Object.keys(this).forEach(function (key){
                try{
                    delete this$1[key];
                }catch(e){}
            });
        };

        return Timer;
    }(Emitter));

    Timer.create = function (interval, options){
        return new Timer(interval, options);
    };

    Timer.now = getNow;

    return Timer;

}());
//# sourceMappingURL=horologe.js.map
