var Noble = require('./lib/noble');
var bindings = require('./lib/resolve-bindings')();

const newNoble = () => {
    return new Noble(bindings)
}

module.exports = newNoble
