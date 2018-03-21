'use strict';

// const fs = require('fs');
// const path = require('path');
const Koa = require('koa');
// const is = require('is-type-of');
const Router = require('./lib/utils/router');
const EggLoader = require('./lib/loader/egg_loader');

const ROUTER = Symbol('EggCore#router');
const EGG_LOADER = Symbol.for('egg#loader');
const methods = [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete', 'all' ];


// EggCore start
class EggCore extends Koa {

  constructor(options) {

    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application';
    super(options);

    const Loader = this[EGG_LOADER];
    this.loader = new Loader({
      baseDir: options.baseDir,
      app: this,
    });
  }

  get router() {
    if (this[ROUTER]) {
      return this[ROUTER];
    }

    const router = this[ROUTER] = new Router({ sensitive: true }, this);
    // register router middleware
    this.beforeStart(() => {
      this.use(router.middleware());
    });
    return router;
  }

  beforeStart(fn) {
    process.nextTick(fn);
  }

}

methods.concat([ 'resources', 'register', 'redirect' ]).forEach(function(method) {
  EggCore.prototype[method] = function(...args) {
    this.router[method](...args);
    return this;
  };
});
// EggCore end

module.exports = {
  EggCore,
  EggLoader,
};
