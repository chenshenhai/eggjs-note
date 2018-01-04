const path = require('path');
const EggCore = require('./egg-core').EggCore;
const EggLoader = require('./egg-core').EggLoader;

class AppLoader extends EggLoader {
  loadAll() {    
    this.loadRouter();
  }
}

class Application extends EggCore {
  
  constructor(options) {
    super(options);
    this.on('error', err => {
      console.error(err);
    })
  }

  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
  get [Symbol.for('egg#loader')]() {
    return AppLoader;
  }
}

module.exports = Application;