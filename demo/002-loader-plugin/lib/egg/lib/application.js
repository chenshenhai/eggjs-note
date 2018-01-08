'use strict';
const path = require('path');
const EggCore = require('./../../egg-core').EggCore;
const EggLoader = require('./../../egg-core').EggLoader;

class AppWorkerLoader extends EggLoader {
  loadAll() {
    this.loadPlugin();
    this.loadConfig();
    this.loadApplicationExtend();
    this.loadContextExtend();
    this.loadRequestExtend();
    this.loadResponseExtend();
    this.loadCustomApp();
    this.loadMiddleware();
    this.loadService();
    this.loadController();
    this.loadRouter();
  }
}

class EggApplication extends EggCore {

  constructor(options) {
    super(options);
    this.on('error', err => {
      console.error(err);
    });

    this.loader.loadAll();
  }

  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
  get [Symbol.for('egg#loader')]() {
    return AppWorkerLoader;
  }
}

module.exports = EggApplication;
