if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}
/*
git remote add origin https://github.com/hollowdoor/horologe.git
git push -u origin master
*/

var Emitter = require('more-events').Emitter;
//http://www.sitepoint.com/creating-accurate-timers-in-javascript/
var Horologe = (function(){

    function Timer(interval, options){

        var timeoutId = null,
            self = this,
            running = false,
            paused = false,
            pausePassed = false,
            stopOn = null,
            count = 0,
            showDiff = typeof options.diff === 'boolean' ? options.diff : false;

        var startTime = Date.now(),
            emitter = new Emitter(this);

        Object.defineProperties(this, {
            interval:  { get: function(){ return interval; } },
            paused: { get: function(){ return paused; } }
        });

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
            count = 0;
            stopOn = null;
            interrupt();
            emit('stop');
            return self;
        }

        function pause(pauseTime){
            paused = true;
            emit('pause');
            pausePassed = (typeof pauseTime === 'boolean') ? pauseTime : true;

            pauseStable();
        }

        function pauseStable(){
            if(!paused){
                return;
            }
            setTimeout(pauseStable, 1);
        }

        function interrupt(){
            if(!isNaN(timeoutId))
                clearTimeout(timeoutId);
            timeoutId = null;
            running = false;
        }

        function start(times){
            stopOn = isNaN(times) ? stopOn : times;
            if(paused){
                //startTime = startTime;// - interval * 2;
                paused = false;
                return;
            }

            if(running){
                stop();
            }

            function next(){
                if(!running) return;
                if(!paused && stopOn && ++count === stopOn + 2){
                    self.stop();
                    return;
                }

                var time = Date.now();
                var diff = (time - startTime) % interval;
                time = !showDiff ? time - diff : time;

                timeoutId = setTimeout(next, interval - diff);

                var passed;
                if(paused){
                    if(pausePassed){
                        startTime = startTime + interval;
                    }
                    return;
                }/*else{
                    passed = time - startTime;
                }*/
                emit('tick', time, time - startTime);
            }

            running = true;

            if(!paused){
                startTime = Date.now();
            }

            if(options.sync){
                if(!paused){
                    startTime = startTime - (startTime % 1000) + 1000;
                }/*else{
                    startTime = startTime + (startTime - (startTime % 1000) + 1000);
                }*/

                paused = false;

                ready(startTime, next, startTime - Date.now());
                return self;
            }

            paused = false;

            ready(startTime, next, 0);
            return self;
        }

        function ready(startTime, next, mil){
            paused = false;
            emit('start', startTime);
            timeoutId = setTimeout(next, mil);
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
