if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

var Emitter = require('more-events').Emitter;
//http://www.sitepoint.com/creating-accurate-timers-in-javascript/
var Horologe = (function(){

    function Timer(interval, options){

        var timeoutId = null,
            preTimeoutId = null,
            self = this,
            running = false,
            paused = false,
            stopOn = null,
            count = -1,
            showDiff = typeof options.diff === 'boolean' ? options.diff : false,
            tickListeners = {};

        var startTime = Date.now();

        Object.defineProperties(this, {
            interval:  { get: function(){ return interval; } },
            paused: { get: function(){ return paused; } }
        });

        var emitter = new Emitter(this);

        this.on = function(){
            emitter.on.apply(emitter, arguments);
            return self;
        };

        this.one = function(){
            emitter.one.apply(emitter, arguments);
            return self;
        };

        this.off = function(){
            emitter.off.apply(emitter, arguments);
            return self;
        };

        this.dispose = function(){
            emitter.dispose();
            for(var n in this){
                this[n] = null;
            }
        };

        function emit(){
            emitter.emit.apply(emitter, arguments);
            return self;
        }

        this.emit = emit;

        function stop(){
            interrupt();
            count = -1;
            stopOn = null;
            emit('stop');
            return self;
        }

        function pause(mil){
            paused = true;
            interrupt();
            emit('pause');
            if(!isNaN(mil)){
                setTimeout(function(){
                    self.start(stopOn);
                }, mil);
            }
        }

        function interrupt(){
            if(!isNaN(timeoutId))
                clearTimeout(timeoutId);
            timeoutId = null;
            running = false;
        }

        function start(times){
            stopOn = isNaN(times) ? stopOn : times;

            if(running)
                interrupt();

            function next(){
                if(!running) return;
                if(stopOn && ++count === times){
                    self.stop();
                    return;
                }

                var time = Date.now();
                var diff = (time - startTime) % interval;
                time = !showDiff ? time - diff : time;

                timeoutId = setTimeout(next, interval - diff);
                emit('tick', time, time - startTime);
            }

            running = true;

            if(!paused){
                startTime = Date.now();
            }

            if(options.sync){
                if(!paused){
                    startTime = startTime - (startTime % 1000) + 1000;
                }
                paused = false;
                emit('start', startTime);
                timeoutId = setTimeout(next, startTime - Date.now());
                return self;
            }

            paused = false;
            emit('start', startTime);
            timeoutId = setTimeout(next, 0);
            return self;
        }

        function onTick(listener){
            return self.on('tick', listener);
        }

        function offTick(listener){
            return self.off('tick', listener);
        }

        this.stop = stop;
        this.pause = pause;
        this.start = start;
        this.onTick = onTick;
        this.offTick = offTick;

    }

    function TimerFactory(interval, options){
        return new Timer(interval, options);
    }

    var expose = {
        create: TimerFactory,
        constructor: Timer
    };

    if(typeof exports === 'object'){
        module.exports = expose;
    }else{
        return expose;
    }
}());
