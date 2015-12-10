horologe
========

Install
-------

`npm install --save horologe`

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
var count = 0, timer = Timer.create(1000, {sync: true}).onTick(onTick).start(5);

function onTick(time, passed){
    var d = new Date(time);
    console.log((++count)+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() + ' ' + passed);
}
```

Timer.create(interval, options) -> timer
----------------------------------------

`interval` is the time between ticks.

`options` is an optional object argument.

options
-------

### options.sync = Boolean

Should the timer be synchronized to seconds.

### options.diff = Boolean

Should the time argument in the on `tick` callback show the drifting of the timer. The default is false.

A `True` value is good if you want a little sanity in knowing how much the timer is off. The timer is self correcting so there should be enough precision.

A `False` value is good if you want the `time` value in the on `tick` callback to at least resemble the your chosen interval. Usually the timing should be off by at most 2 milliseconds if not zero so it shouldn't be a problem for most usages.

The effects of drifting are emphasized by running code so keep that in mind.

Methods
-------

### timer.start(amount)

Start the timer. `amount` is optional. `amount` is an integer for how many times to run the timer. If amount is not set then the timer will run indefinitely, or until stop is called.

### timer.stop()

Stop the timer. Can be called inside the `callback`.

### timer.pause(milliseconds)

Pause the timer.

If milliseconds are set then a timer will be created and after milliseconds timeout then the timer will be restarted.

`milliseconds` are optional, and if you don't passed a number to `pause` then the next time you call `start` if you don't pass an amount to `start` then the old amount is used.

### on(name, callback)

Set a listener on an event.

### off(name, callback)

Remove a listener.

### dispose()

Destroy the timer.

### onTick(callback), offTick(callback)

Aliases to `on('tick', callback)`, and `off('tick', callback)` respectively.

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

About
-----

The `horologe` timer is very close to the `millisecond` precision. At worst it will be off by a 100th of a second. In my tests it remained in the 2 millisecond range of precision for most iterations of the interval. `horologe` doesn't use `precision.now` so keep that in mind.
