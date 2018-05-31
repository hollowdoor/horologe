horologe
========

Install
-------

`npm install --save horologe`

`horologe` is now at version 2. There have been changes. Check this documentation to see what is different from version 1.

Usage
-----

```javascript
var Timer = require('horologe');
var count = 0;
var timer = Timer.create(1000, {sync: true});
timer.on('tick', function(time, passed){
    var d = new Date(time);
    console.log((++count) + ' ' + d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() + ' ' + passed);
});
timer.start(20);
```

or create, and setup all at once.

```javascript
var count = 0, timer = Timer.create(1000, {sync: true}).on('tick', onTick).start(5);

function onTick(time, passed){
    var d = new Date(time);
    console.log((++count)+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() + ' ' + passed);
}
```

Timer creation
----------------------------------------

### new Timer(interval, options)

`interval` is the time between ticks.

`options` is an optional object argument.

There are two ways to create a timer.

```javascript
let timer1 = Timer.create(1000, {});
let timer2 = new Timer(1000, {});
```

options
-------

### options.sync = 1000

What should the timer be synchronized to? Using milliseconds you can adjust the timer synchronization to system time. Using a falsy value will set *no synchronization*.

### options.tick = null

Set a tick function. This is the same as `timer.on('tick', ()=>{})`

### options.highres = false

`options.highres` is an experimental option. Setting it will make the timer use `performance.now()` instead of `Date.now()` for timing.

Properties
----

### timer.interval

The interval set in the constructor.

### timer.paused

Is the timer paused?

### timer.running

Is the timer running?

### timer.count

How many ticks of the timer have been done?

### timer.percent

What's the percentage of time complete until the timer is stopped by it's range? If the range is infinite `timer.percent` returns zero.

Methods
-------

### timer.start()

Start the timer at the current time.

### timer.range(amount)

`timer.range(amount)` sets the time range, or when the timer ends. The default is `Infinity`.

### timer.stop()

Stop the timer.


### timer.pause(limit)

Pause the timer.

`limit` has a default of `Infinity`.

`limit` controls how long the timer will be paused.


### on(name, callback)

Set a listener on an event.

### off(name, callback)

Remove a listener.

### dispose()

Destroy the timer.

Events
------

### tick

Emitted at every interval of the timer.

The arguments to the listener are `time`, and `passed`.

```javascript
timer.on('tick', function(time, passed){

});
```

`time` is the current system time.

`passed` is how much time has passed since the timer was started.

### start

Emitted when the timer is started.

`startTime` is the only argument for the `start` listener.

```javascript
timer.on('start', function(startTime){

});
```

### stop

Emitted when the timer is stopped. No arguments are passed to the listener.

### pause

Emitted when the timer is paused. No arguments are passed to the listener.

### complete

Emitted when the timer ends, and only if an amount is passed to the `start` method.

About
-----

The `horologe` timer is very close to the `millisecond` precision. At worst it will be off by a 100th of a second. In my tests it remained in the 2 millisecond range of precision for most iterations of the interval. `horologe` doesn't use `precision.now` so keep that in mind.
