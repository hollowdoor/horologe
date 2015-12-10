var Timer = require('horologe');

var count = 0, timer = Timer.create(1000, {sync: true}).onTick(onTick).start(5);

function onTick(time, passed){
    var d = new Date(time);
    console.log((++count)+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() + ' ' + passed);
}
