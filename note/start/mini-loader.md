# Egg.js最简加载器

之前的几章可以看出，Egg.js的项目目录`app/router.js`中的业务代码，都是依靠`egg-core`模块中的加载器`EggLoader`来实现的。


## 加载器的主要作用

前几章的讲解源码业务代码都集中在路由文件中，实际项目中的业务代码不只有路由文件，还有其他纵向分层和横向分层的源码文件，例如`controller`、`service`、`middleware`等。Egg.js是通过加载器将这些分层的项目业务代码、中间件和插件代码**大部分功能**注入到 `this` 、`this.app`或`this.ctx`对象里面。

Egg.js的加载内容，从实现内容可以分成两类，一类是加载项目业务代码文件，另一类是加载增强系统能力的代码文件或模块。

- 业务代码文件
  - 项目业务配置 `config`
  - 项目路由层 `router`
  - 项目控制层 `controller`
  - 项目业务层 `service`
  - 其他业务代码
- 系统增强代码文件或模块
  - 系统中间件 `middleware`
  - 系统插件 `plugin`
  - 其他系统增强

然而所有完整的加载器流程很复杂，这一章是讲最简单加载器的实现，就拿`controller`加载的实现来分析最简加载器。

## controller加载过程

- 应用进程启动
- 启动应用加载器
  - 加载 `controller`
    - 加载 `controller` 目录下所有文件
    - 将加载后的内容挂载在 `this.app` 上

## controller加载实现源码详解

demo传送门 [https://github.com/chenshenhai/eggjs-note/tree/master/demo/001-mini-loader](https://github.com/chenshenhai/eggjs-note/tree/master/demo/001-mini-loader)

demo启动
```sh
cd 001-mini-loader

npm i

# 启动demo
npm run start
```

### EggApplication初始化

EggApplication初始化构建时候，就通过 `this.loader.load()` 方法触发了**应用进程加载器** `AppWorkerLoader`加载所有内容方法

demo/001-mini-loader/lib/egg/index.js
```js
class EggApplication extends EggCore {
  constructor(options) {
    // ....
    this.loader.loadAll();
    // ...
  }
  // ...
}
```

### AppWorkerLoader 加载所有内容

`AppWorkerLoader` 继承了Egg.js的内置基础加载器`EggLoader`类，并且定义和实现了触发加载所有内容的方法`loadAll()`，其中触发了继承自`EggLoader`类的`controller`加载方法 `this.loadRouter()`

demo/001-mini-loader/lib/egg/index.js
```js
class AppWorkerLoader extends EggLoader {
  loadAll() {
    this.loadController();
    this.loadRouter();
  }
}
```

### loadController 实现

基础加载器`EggLoader`类，所有挂载在该类上的混合方法，例如`this.loadController`从`egg-core/lib/loader/mixin/controller.js` 挂载到 `EggLoader`上的，都可以调用该类的方法，其中`controller`就是调用了 `EggLoader.loadToApp(...)`方法，将项目目录`app/controller/*.js`的js文件都加载起来，挂载在`this.app`对象里面

demo/001-mini-loader/lib/egg-core/lib/loader/mixin/controller.js
```js
module.exports = {
  // ...
  loadController(opt) {
    opt = Object.assign({
      directory: path.join(this.options.baseDir, 'app/controller'),
    }, opt);
    const controllerBase = opt.directory;
    this.loadToApp(controllerBase, 'controller', opt);
  },
  // ...
};
```

demo/001-mini-loader/lib/egg-core/lib/loader/egg_loader.js
```js
const FileLoader = require('./file_loader');
class EggLoader {
  constructor(options) {
    this.options = options;
    this.app = this.options.app;
  }
  // ...
  loadToApp(directory, property, opt) {
    const target = this.app[property] = {};
    opt = Object.assign({}, {
      directory,
      target,
    }, opt);
    new FileLoader(opt).load();
  }
  // ...
}

const loaders = [
  // ...
  require('./mixin/controller'),
];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}
```

### 文件加载核心工具 FileLoader

`EggLoader.loadFile(...)` 的具体实现是通过 `FileLoader` 类来实现的。
具体实现是输入 `controller`的相对地址和挂载的目标对象`this.app.controller`。

`FileLoader` 会根据 `controller`的相对地址生成绝对地址来获取 `app/controller` 目录下的所有js文件，这里考虑到代码最简实现，只读取 `app/controller` 目录下第一层级子目录，先不考虑文件名格式规范，也不考虑文件export出的内容，默认都是JSON对象，对象属性都是Async Function。

demo/001-mini-loader/lib/egg-core/lib/loader/file_loader.js
```js
class FileLoader {

  constructor(options) {
    this.options = options 
  }

  load() {
    const items = this.parse();
    const target = this.options.target;
    for (const item of items) {
      target[item.properties[0]] = item.exports;
    }
    return target;
  }

  parse() {
    const files = this.options.match || [ '**/*.js' ];

    const directory = this.options.directory;

    const items = [];
    const filepaths = globby.sync(files, { cwd: directory });
    for (const filepath of filepaths) {
      const fullpath = path.join(directory, filepath);
      if (!fs.statSync(fullpath).isFile()) continue;
      const properties = [ filepath.substring(0, filepath.lastIndexOf('.')).split('/').pop() ];
      const exports = require(fullpath);
      if (exports == null) continue;

      items.push({ fullpath, properties, exports });
    }
    return items;
  }

}
```

## 总结
- Egg.js 加载器都是 以`EggLoader`类为基础的
- 文件加载和挂载核心是`FileLoader`类
- 并不是所有加载和挂载都用到`FileLoader`
  - `router`的加载就很特殊，是单独的硬编码的写入到`this`和`this.app`中
- `app/controller`层是挂载到`this.app`, 但是并不代发所有内容都挂载到`this.app`中，有些是直接挂载到`this`或者`this.ctx`中

