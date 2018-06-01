import { Emitter } from 'more-events';

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


        Emitter$$1.call(this);

        var now = makeNow(highres);

        var timeoutId = null,
            running = false,
            paused = false,
            count = 0,
            pauseTime = Infinity,
            timeRange = Infinity,
            startTime = now(),
            pausedTime = 0,
            pauseStart = 0;


        if(typeof tick === 'function'){
            this.on('tick', tick);
        }

        Object.defineProperties(this, {
            interval: {get: function get(){ return interval; }},
            paused: {get: function get(){ return paused; }},
            running: {get: function get(){ return running; }},
            count: {get: function get(){ return count; }},
            percent: {get: function get(){ return count / (timeRange / interval) * 100; }},
            startTime: {get: function get(){ return startTime; }}
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

            var passed = time - startTime - pausedTime;

            if(time > startTime + timeRange + pausedTime){
                this$1.emit('complete');
                this$1.stop();
                return;
            }

            timeoutId = setTimeout(next, interval - diff);

            if(!paused){
                this$1.emit('tick', time, passed, diff);
            }else{
                pausedTime = time - pauseStart + pausedTime;
                if(time < pauseTime){
                    return;
                }
                paused = false;
            }
        };

        function stop(){
            count = 0;
            paused = false;
            pauseTime = Infinity;
            startTime = null;
            interrupt();
            this.emit('stop');
            return this;
        }

        function pause(limit){
            if ( limit === void 0 ) limit = Infinity;

            paused = true;
            pauseStart = now();
            if(sync){
                pauseStart = pauseStart - (pauseStart % sync) + sync;
            }

            pauseTime = limit + pauseStart;
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

            if(!paused){
                startTime = now();
            }

            if(sync){
                if(!paused){
                    startTime = startTime - (startTime % sync) + sync;
                }

                ready(startTime, next, startTime - now() + interval);
                return this;
            }

            ready(startTime, next, interval);
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

export default Timer;
//# sourceMappingURL=bundle.es.js.map
