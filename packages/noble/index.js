var Noble = require('./lib/noble');
var bindings = require('./lib/resolve-bindings')();
var Peripheral = require('./lib/peripheral');
var Service = require('./lib/service');
var Characteristic = require('./lib/characteristic');
var Descriptor = require('./lib/descriptor');

const newNoble = () => {
    return new Noble(bindings)
}

module.exports = {
    newNoble,
    Peripheral,
    Service,
    Characteristic,
    Descriptor
}
