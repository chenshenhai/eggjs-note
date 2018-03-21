'use strict';

const fs = require('fs');
const is = require('is-type-of');
const FileLoader = require('./file_loader');
const utils = require('./../utils');

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

    const ret = utils.loadFile(filepath);
    // function(arg1, args, ...) {}
    if (inject.length === 0) inject = [ this.app ];
    return is.function(ret) ? ret(...inject) : ret;
  }


  loadToApp(directory, property, opt) {
    const target = this.app[property] = {};
    opt = Object.assign({}, {
      directory,
      target,
    }, opt);
    new FileLoader(opt).load();
  }
}


const loaders = [
  require('./mixin/router'),
  require('./mixin/controller'),
];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

// EggLoader end


module.exports = EggLoader;
