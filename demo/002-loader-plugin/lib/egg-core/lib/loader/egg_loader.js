'use strict';
const fs = require('fs');
const path = require('path');
const isFunction = require('is-type-of').function;
const utils = require('../utils');

class EggLoader {

  constructor(options) {
    this.options = options;
    this.app = this.options.app;
    this.eggPaths = this.getEggPaths();
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

  getEggPaths() {
    let eggPaths = [];
    let proto = this.app;
    const eggPath = proto[Symbol.for('egg#eggPath')];
    const realpath = fs.realpathSync(eggPath);
    if (!eggPaths.includes(realpath)) {
      eggPaths.unshift(realpath);
    }
    return eggPaths;
  }


  /**
   * @name getLoadUnits 获取加载单元
   */ 
  getLoadUnits() {
    if (this.dirs) {
      return this.dirs;
    }

    const dirs = this.dirs = [];

    if (this.orderPlugins) {
      for (const plugin of this.orderPlugins) {
        dirs.push({
          path: plugin.path,
          type: 'plugin',
        });
      }
    }

    // framework or egg path
    for (const eggPath of this.eggPaths) {
      dirs.push({
        path: eggPath,
        type: 'framework',
      });
    }

    // application
    dirs.push({
      path: this.options.baseDir,
      type: 'app',
    });
    return dirs;
  }

}

const loaders = [
  require('./mixin/plugin'),
  require('./mixin/extend'),
  require('./mixin/router'),
];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

module.exports = EggLoader;
