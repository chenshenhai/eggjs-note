'use strict';
const fs = require('fs');
const isFunction = require('is-type-of').function;
const utils = require('../utils');

class EggLoader {

  constructor(options) {
    this.options = options;
    this.app = this.options.app;

  }

  loadFile(filepath, ...inject) {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const ret = utils.loadFile(filepath);
    // function(arg1, args, ...) {}
    if (inject.length === 0) inject = [ this.app ];
    return isFunction(ret) ? ret(...inject) : ret;
  }
}

const loaders = [
  require('./mixin/plugin'),
  require('./mixin/router'),
];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

module.exports = EggLoader;
