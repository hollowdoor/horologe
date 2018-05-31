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


            Emitter$$1.call(this);

            var now = makeNow(highres);

            var timeoutId = null,
                running = false,
                paused = false,
                count = 0,
                timeRange = Infinity,
                startTime = now();


            if(typeof tick === 'function'){
                this.on('tick', tick);
            }

            Object.defineProperties(this, {
                interval: {get: function get(){ return interval; }},
                paused: {get: function get(){ return paused; }},
                running: {get: function get(){ return running; }},
                count: {get: function get(){ return count; }},
                percent: {get: function get(){ return count / (timeRange / interval) * 100; }}
            });

            var interrupt = function (){
                clearTimeout(timeoutId);
                timeoutId = null;
                running = false;
            };

            var ready = function (startTime, next, mil){
                paused = false;
                timeoutId = setTimeout(next, mil);
                this$1.emit('start', startTime);
            };

            var next = function (){
                if(!running) { return; }

                var time = now();
                var diff = (time - startTime) % interval;
                time = time - diff;

                if(paused){
                    if(time >= pauseTime + startTime) { return; }
                    paused = false;
                }

                if(++count > timeRange / interval){
                    this$1.emit('complete');
                    this$1.stop();
                    return;
                }

                timeoutId = setTimeout(next, interval - diff);

                this$1.emit('tick', time, time - startTime, diff);
            };

            function stop(){
                count = 0;
                paused = false;
                interrupt();
                this.emit('stop');
                return this;
            }

            function pause(limit){
                if ( limit === void 0 ) limit = Infinity;

                paused = true;
                pauseTime = limit;
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

            function start(){
                //stopOn = timeRange / interval;

                if(running){
                    this.stop();
                }

                running = true;

                if(paused){
                    paused = false;
                }else{
                    startTime = now();
                }

                if(sync){
                    if(!paused){
                        startTime = startTime - (startTime % sync) + sync;
                    }

                    ready(startTime, next, startTime - now());
                    return this;
                }

                ready(startTime, next, 0);
                return this;
            }

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