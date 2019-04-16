var Bleno = require('./lib/bleno');

const newBleno = () => {
    return new Bleno()
}

var PrimaryService = require('./lib/primary-service');
var Characteristic = require('./lib/characteristic');
var Descriptor = require('./lib/descriptor');

module.exports = {
    newBleno,
    PrimaryService, 
    Characteristic,
    Descriptor
}
