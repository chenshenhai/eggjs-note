const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const is = require('is-type-of');

const ROUTER = Symbol('EggCore#router');
const EGG_LOADER = Symbol.for('egg#loader');
const methods = [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete', 'all'];

// Router start 
class Router extends KoaRouter {
  constructor(opts, app) {
    super(opts);
    this.app = app;
  }
}
// Router end 


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

const LoaderMixinRouter = {
  loadRouter() {  
    // 加载Egg.js应用工程目录的路由
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  },
}
const loaders = [
  LoaderMixinRouter,
];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}
// EggLoader end

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
    process.nextTick(fn)
  }
}

methods.concat(['resources', 'register', 'redirect' ]).forEach(function (method) { 
  EggCore.prototype[method] = function(...args) {
    this.router[method](...args); 
    return this;
  }; 
})
// EggCore end


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