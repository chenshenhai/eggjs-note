'use strict';

const fs = require('fs');
const path = require('path');
const is = require('is-type-of');

// EggLoader start
class EggLoader {
  constructor(options) {
    this.options = options;
    this.app = this.options.app;
  }

  loadFile(filepath, ...inject) {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const extname = path.extname(filepath);
    if (![ '.js', '.node', '.json', '' ].includes(extname)) {
      return fs.readFileSync(filepath);
    }
    const ret = require(filepath);
    // function(arg1, args, ...) {}
    if (inject.length === 0) inject = [ this.app ];
    return is.function(ret) ? ret(...inject) : ret;
  }
}


const loaders = [
  require('./mixin/router'),
];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

// EggLoader end


module.exports = EggLoader;
