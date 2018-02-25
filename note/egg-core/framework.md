# egg-core结构讲解 【待续...】

## 实现逻辑
- EggApplication启动  【`new EggApplication(...).ready(...)` 】
- EggApplication继承EggCore 【`EggApplication extends EggCore`】
  - EggApplication构建过程 【`EggApplication constructor`】
    - 执行内置EggLoader按照顺序加载所有中间件、插件等内容 【`this.loader.load()`】
- EggCore继承Koa 【`EggCore extends Koa`】
  - EggCore构建过程 【`EggCore constructor`】
    - 加载器初始化 【`this.loader = new EggLoader(...)`】
    - 路由初始化 【`this.router = new Router()`】
      - Router继承KoaRouter中间件 【`Router extends require('koa-router')`】
    - 路由方法注入
- EggLoader
  - EggLoader构建过程 【`EggLoader constructor`】
  - 注入各种加载器方法
 
## 目录结构

源码demo传送门 [https://github.com/chenshenhai/eggjs-note/tree/master/demo/002-main](https://github.com/chenshenhai/eggjs-note/tree/master/demo/002-main)

```sh
.
├── app # Egg.js 应用目录
│   └── router.js
├── index.js # Egg.js 应用启动文件
├── lib # Egg.js 相关模块目录
│   ├── egg # 模拟npm模块egg的最小系统
│   │   ├── index.js
│   │   └── lib
│   │       └── application.js
│   └── egg-core # 模拟npm模块egg-core的最小系统
│       ├── index.js
│       └── lib
│           ├── egg.js # egg-core核心类，继承koa
│           ├── loader
│           │   ├── egg_loader.js # egg-core加载器
│           │   └── mixin # egg-core 各加载器内容
│           │       └── router.js
│           └── utils # egg-core工具目录
│               ├── index.js # egg-core通用工具
│               └── router.js # egg-core内置Router，继承koa-router
└── package.json
```
 

## 使用详解

### egg-core使用流程

#### egg-core使用

```js
const path = require('path');
const EggCore = require('egg-core').EggCore;
const EggLoader = require('egg-core').EggLoader;

class AppWorkerLoader extends EggLoader {
  loadAll() {
    this.loadPlugin();
    this.loadApplicationExtend();
    this.loadContextExtend();
    this.loadRequestExtend();
    this.loadResponseExtend();
    this.loadRouter();
    // other loader
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

const app = new EggApplication({
  baseDir: __dirname, //  ./app 目录所在的同级目录
  type: 'application',
});


app.ready(err => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  const server = require('http').createServer(app.callback());
  server.once('error', err => {
    console.log('[app_worker] server got error: %s, code: %s', err.message, err.code);
    process.exit(1);
  });
  server.listen(7001, () => {
    console.log('server started at 7001');
  });
});
```

从上述代码可以看出 `egg-core`的使用流程是

- 1. `egg-core`提供了两个最核心的类 `EggCore` `EggLoader` 
  - 新建 `WorkerLoader` 继承 `EggLoader` ， 定义所需的加载器
  - 新建 `EggApplication` 继承 `EggCore`，定义WEB应用的类
    - 装载 `WorkerLoader`
- 2. 配置Egg.js项目目录(`./app`)给 `app = new EggApplication({...})`
- 3. 启动应用

可以抽象出以下内容
 
- 服务启动前
  - 加载所有loader
  - 加载所有中间件、插件等内容
  - 路由注册
- 服务启动 