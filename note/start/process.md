# Egg.js最小流程

从上一章《Egg.js最小系统》中，通过demo中的核心文件 [001-mini/lib/egg.js](https://github.com/chenshenhai/eggjs-note/blob/master/demo/001-mini/lib/egg.js)可以看到一百多行代码实现了 Egg.js 的最小系统。从一百多行的代码中会不会发现，代码的执行流程比较错综复杂。举个例子，为什么在`app/router.js`编写路由(Router)和控制器(Controller)就可以注册路由和操作？这些问题在这一章就会讲解 Egg.js最小系统的执行流程，主要分两部分讲述执行流程。

- **Egg.js 应用部分**
  - 路由文件
    - 路由注册
    - 控制器处理
- **Egg.js 服务部分**
  - 提供`http`服务
  - 读取`Egg.js 项目部分`的路由文件(`Router + Controller`)



## 最小流程

- 从`npm start`开始
- `app`实例初始化
  - `EggApplication` 构建
    - 继承 `EggCore`
      - 继承 `Koa`
      - 注册内置路由器 `this.router`
        - this.router 初始化 `new Router()`
          - 继承 `KoaRouter`
      - 将路由方法注册到 对象属性里
    - 注册内置加载器 `AppWorkerLoader`
      - 继承 `EggLoader` 
    - 执行所有加载器 `this.loader.loadAll();`
      - 执行加载路由 `this.loadRouter()`
        - 加载 `app/router.js` 注入 `this.app`
- 服务初始化
  - 用`http.createServer`注入`app`
  - 监听错误
  - 启动`server`


## Egg.js 应用部分流程讲解

### app初始化
```js
const EggApplication = require('./lib/egg'); 

// 初始化Egg.js应用
const app = new EggApplication({
  baseDir: __dirname,
  type: 'application',
});

```

#### EggApplication初始化

```js
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
```
- `EggApplication` 的初始化过程中包括了 `AppWorkerLoader` 应用进程加载器的初始化。
- `EggApplication` 中属性 `Symbol.for('egg#eggPath')` 是设置项目应用文件路径，通常是`./app/...`所在的路径。
- `EggApplication` 中属性 `Symbol.for('egg#loader')` 是设置应用加载器的，这设置的是应用的项目进程加载器。
  - `AppWorkerLoader` 继承 `EggLoader`
  - `EggApplication`是继承了`EggCore`，`EggCore`中构建时候就会把`Symbol.for('egg#loader')`属性的加载器注入到`this.loader`上
- `EggApplication` 在构建过程中，`this.loader.loadAll()` 就执行了加载器的全部执行
  - 加载器执行了什么可以看`EggApplication`的父类`EggCore`的构建过程


#### EggCore初始化

```js
class EggCore extends Koa {
  constructor(options) {
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application';
    super(options);

    const Loader = this[EGG_LOADER]; // this[Symbol.for('egg#loader')]
    this.loader = new Loader({
      baseDir: options.baseDir,
      app: this,
    });
  }

  get router() {
    // this[Symbol('EggCore#router')]
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
```

`EggCore` 初始化过程主要有两个，一个是初始化加载器，加载器jiushi 派生类注入的`loader`(注：`this[EGG_LOADER]`就是指代EggApplication注入的`this[Symbol.for('egg#loader')]`属性)，二是初始化路由能力。

##### EggCore初始化加载器

- `EggCore`派生类`EggApplication`会注入属性名称为`Symbol.for('egg#loader')`的加载器
- `EggCore`将属性`Symbol.for('egg#loader')`的加载器 `this.loader` 实例化，加入项目应用的路径`baseDir`和应用实例化(`app`)“指针”`this`。

##### EggCore初始化路由能力
- `EggCore` 初始化过程中会注入 属性名称为 `Symbol('EggCore#router')`的路由实例`this.router`。
- `EggCore.router`实例中的路由方法(`get`、`post`、`delete`等)，注入到 `EggCore`的原型中。
  - 作用就是后续实例化应用`app`就可以直接按照`app.get('/xxx', [callback])`类似的方式操作路由
  - 实例化应用`app`会在后面加载器内置过程会注入`app/router.js`中，直接在项目文件中使用`app[method]`方式使用路由。
- `Router`的来源是继承了`KoaRouter`，是Koa.js的一个路由中间件，注意这里是使用了`koa-router@7 +`版本，主要是支持了Koa2+的`async/await`。


#### 加载器初始化

- 上面提到的 `EggApplication` 中属性 `Symbol.for('egg#loader')`是加载器 `AppWorkerLoader`的实例
- `AppWorkerLoader` 继承了加载器的基类 `EggLoader`

```js
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
```

- `EggLoader`是一个工具类，本身不会自动执行，只会在派生类的实例触发相关方法操作才会执行
- `loaders`是个临时变量，用来存放所有加载器内置方法的数组，最后所有方法都会注入到`EggLoader`中。因此就会出现这种情况，在`AppWorkerLoader`这样的派生类构建中，可以执行`this.loadRouter()`的操作
- `EggLoader.loadFile()` 是加载器的核心方法，主要用于加载文件到缓存里，说白了就是对Node.js原生`require()`全局方法的封装。
  - 特别是在加载的文件内容类型是`Function`时候，会注入`EggApplication`应用实例`app`。
  - 这就是为什么执行`this.loadRouter()`后，加载的路由配置文件`app/router.js`中，可以执行方法`app.get()`等路由方法。


## Egg.js 服务部分流程讲解

### 服务初始化

说了这么久，在这里的 `EggApplication` 只提供了项目应用的初始化，也可以说是项目实例的初始化。然而，长篇大论之后，到现在还没说到最基本的HTTP服务。`EggApplication`最底层是继承了`Koa`，本身是可以直接启动HTTP服务的，这里建议最好应用和服务分离解耦。以`EggApplication`只用来创建应用实例，独立用`http`模块启动，对于以后可以更加方便处理HTTPS迁移，多进程利用等服务操作。


```js
const EggApplication = require('./lib/egg');
const http = require('http');

// 初始化Egg.js应用
const app = new EggApplication({
  baseDir: __dirname,
  type: 'application',
});

const server = http.createServer(app.callback());
server.once('error', err => {
  console.log('[app_worker] server got error: %s, code: %s', err.message, err.code);
  process.exit(1);
});
server.listen(7001, () => {
  console.log('server started at 7001');
});
```
- 初始化 `app` 时候，传入的`baseDir`是整个项目的更目录，`EggApplication`就会将该参数一直透传到`EggLoader`和`EggCore`中
- 传入的`baseDir`会在`EggLoader`执行读取对应`${baseDir}/app/router.js` 项目应用文件。

### 项目应用逻辑

首先说明一下，项目应用目录`app/`是主要写业务代码，和 Egg.js 的最小系统是完全解耦的，但是有严格的约定，这里先从 `app/router.js` 说起。

```js
module.exports = app => {
  app.get('/index', async ctx => {
    ctx.body = 'hello index';
  });
  app.get('/', async ctx => {
    ctx.body = 'hello world';
  });
};
```

- `app` 在上面 **加载器初始化** 中说过，是通过 `EggLoader.loadFile()`方法，把`app` 注入到 `app/router.js` 的路由注册里面。
- 路由的使用方式和`koa-router`的一致。 



