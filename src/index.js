import { Emitter } from 'more-events';

let getNow = Date.now !== void 0
? Date.now
: ()=>new Date().getTime();

const makeNow = (highres)=>{
    if(!highres) return getNow;

    let bind = !Function.prototype.bind
    ? (f, c)=>(...a)=>f.apply(c, a)
    : (f, c)=>f.bind(c);

    const perfNow = bind((function() {
      return performance.now       ||
             performance.mozNow    ||
             performance.msNow     ||
             performance.oNow      ||
             performance.webkitNow ||
             function() { return getNow(); };
    })(), performance);

    const navstart = performance.timing.navigationStart;

    return ()=>{
        return navstart + perfNow();
    };
};



export default class Timer extends Emitter {
    constructor(interval = 1000, {
        sync = 1000,
        tick = null,
        highres = false
    } = {}){

        super();

        let now = makeNow(highres);

        let timeoutId = null,
            running = false,
            paused = false,
            pausePassed = false,
            count = 0,
            pauseTimes = 0,
            timeRange = Infinity,
            stopOn = Infinity,
            startTime = now();


        if(typeof tick === 'function'){
            this.on('tick', tick);
        }

        Object.defineProperties(this, {
            interval: {get(){ return interval; }},
            paused: {get(){ return paused; }},
            running: {get(){ return running; }},
            count: {get(){ return count; }},
            percent: {get(){ return count / (timeRange / interval) * 100; }},
            startTime: {get(){ return startTime; }}
        });

        let interrupt = ()=>{
            clearTimeout(timeoutId);
            timeoutId = null;
            running = false;
        };

        let ready = (startTime, next, mil)=>{
            paused = false;
            timeoutId = setTimeout(next, mil);
            this.emit('start', startTime);
        };

        let next = ()=>{
            if(!running) return;

            var time = now();
            //The less accurate diffing
            //var diff = (time - startTime) % interval;
            var diff = (time - startTime) - (++count * interval);

            time = time - diff;

            if(paused){
                if(time >= pauseTime + startTime) return;
                paused = false;
            }

            if(count > timeRange / interval){
                this.emit('complete');
                this.stop();
                return;
            }

            let passed = time - startTime;

            timeoutId = setTimeout(next, interval - diff);

            this.emit('tick', time, passed, diff);
        };

        function stop(){
            count = 0;
            stopOn = Infinity;
            paused = false;
            startTime = null;
            interrupt();
            this.emit('stop');
            return this;
        }

        function pause(limit = Infinity){
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
    dispose(){
        super.dispose();
        Object.keys(this).forEach(key=>{
            try{
                delete this[key];
            }catch(e){}
        });
    }
}

Timer.create = (interval, options)=>{
    return new Timer(interval, options);
};

Timer.now = getNow;
