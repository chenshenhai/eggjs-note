const process = require('process');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const Koa = require('koa');
const is = require('is-type-of');
const Router = require('./utils/router');
const utils = require('./utils');

const EGG_LOADER = Symbol.for('egg#loader');
const ROUTER = Symbol('EggCore#router');
const INIT_READY = Symbol('EggCore#initReady');
const EGG_READY_TIMEOUT_ENV = Symbol('EggCore#eggReadyTimeoutEnv');


class EggCore extends Koa {
  constructor(options = {}) {
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application'; 

    super();

    this._options = this.options = options;

    // get app timeout from env or use default timeout 10 second
    const eggReadyTimeoutEnv = process.env.EGG_READY_TIMEOUT_ENV;
    this[EGG_READY_TIMEOUT_ENV] = Number.parseInt(eggReadyTimeoutEnv || 10000);
    
    const Loader = this[EGG_LOADER];
    this.loader = new Loader({
      baseDir: options.baseDir,
      app: this
    });
    this[INIT_READY]();
  }

  get [EGG_LOADER]() {
    return require('./loader/egg_loader');
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


  [INIT_READY]() {
    require('ready-callback')({ timeout: this[EGG_READY_TIMEOUT_ENV] }).mixin(this);
    
    this.on('ready_stat', data => {
      console.info('[egg:core:ready_stat] end ready task %s, remain %j', data.id, data.remain);
    }).on('ready_timeout', id => {
      console.warn('[egg:core:ready_timeout] %s seconds later %s was still unable to finish.', this[EGG_READY_TIMEOUT_ENV] / 1000, id);
    });

    this.ready(() => console.log('egg emit ready, application started'));
  }

  beforeStart(scope) {
    if (!is.function(scope)) {
      throw new Error('beforeStart only support function');
    }

    // get filename from stack
    const name = utils.getCalleeFromStack(true);
    const done = this.readyCallback(name);

    // ensure scope executes after load completed
    process.nextTick(() => {
      utils.callFn(scope).then(() => done(), done);
    });
  }

};

utils.methods.concat([ 'all', 'resources', 'register', 'redirect' ]).forEach(method => {
  EggCore.prototype[method] = function(...args) {
    this.router[method](...args);
    return this;
  };
});

module.exports = EggCore;