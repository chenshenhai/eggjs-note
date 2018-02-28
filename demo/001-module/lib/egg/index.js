'use strict';

const { EggCore, EggLoader } = require('./../egg-core');

// EggApplication start
class AppWorkerLoader extends EggLoader {
  loadAll() {
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
// EggApplication end

module.exports = EggApplication;
