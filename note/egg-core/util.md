# 实用内置工具

为什么要划分一章来讲解`egg-core`的实用工具？因为之前面几章的讲解中，为了讲解方便，会流程功能都是简化了很多代码逻辑，其中大部分是简化了`egg-core`工具方法和工具类。

一个开源的框架中，肯定有使用很多重复的功能代码，通常会把这些同功能的代码抽象出来封装成相关的工具方法和工具类。`egg-core` 中也抽象出很多功能方法和工具类。


`egg-core` 的内置实用工具可以划分出以下两种
- 加载器工具
- 其他工具

```sh
.
├── index.js
└── lib
    ├── egg.js
    ├── loader 
    │   ├── context_loader.js # 加载器工具: 上下文加载器
    │   ├── egg_loader.js # 加载器工具: egg核心加载器
    │   ├── file_loader.js # 加载器工具: 文件加载器
    │   └── mixin/
    └── utils
        ├── base_context_class.js # 其他工具: 上下文基类
        ├── index.js # 其他工具: 通用工具方法集合
        ├── router.js # 其他工具: 路由 
        └── sequencify.js # 其他工具: 顺序处理器
```

## 加载器工具

顾名思义，就是`egg-core`中提供各种加载功能的工具，按照功能依赖的排序如下所示。

- 文件加载器 `FileLoader`
- 上下文加载器 `ContextLoader`  
- egg核心加载器 `EggLoader`


### 文件加载器 FileLoader

文件加载器是一个工具类，主要是用于加载某个目录下的所有js文件，并且封装成约定的对象挂载到指定的目标上，具体的功能可以分成以下几点。
- 加载目录下的所有`*/**.js`文件
- 根据目录名称和文件名称，按照配置的命名格式`caseStyle` 处理成目标对象`target`字段名称
- 根据`js`文件export出不同类型的内容(`Function//GeneratorFunction/AsyncFunction/Object`)进行区分和封装处理
- 将封装好的目标对象`target`挂载到注入目标上`inject`

例如：将`app/controller/`目录下所有层级的`*/**.js`文件都加载，封装成`controller`对象，挂载到`this.app`对象上。

源码的文件结构如下：

```js
class FileLoader {

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String|Array} options.directory - directories to be loaded
   * @param {Object} options.target - attach the target object from loaded files
   * @param {String} options.match - match the files when load, support glob, default to all js files
   * @param {Boolean} options.typescript - whether support typescript, default to false
   * @param {String} options.ignore - ignore the files when load, support glob
   * @param {Function} options.initializer - custom file exports, receive two parameters, first is the inject object(if not js file, will be content buffer), second is an `options` object that contain `path`
   * @param {Boolean} options.call - determine whether invoke when exports is function
   * @param {Boolean} options.override - determine whether override the property when get the same name
   * @param {Object} options.inject - an object that be the argument when invoke the function
   * @param {Function} options.filter - a function that filter the exports which can be loaded
   * @param {String|Function} options.caseStyle - set property's case when converting a filepath to property list.
   */
  constructor(options) {
   // ...
  }

  /**
   * attach items to target object. Mapping the directory to properties.
   * `app/controller/group/repository.js` => `target.group.repository`
   * @return {Object} target
   * @since 1.0.0
   */
  load() {
   // ...
  }

  /**
   * Parse files from given directories, then return an items list, each item contains properties and exports.
   *
   * For example, parse `app/controller/group/repository.js`
   *
   * ```
   * module.exports = app => {
   *   return class RepositoryController extends app.Controller {};
   * }
   * ```
   *
   * It returns a item
   *
   * ```
   * {
   *   properties: [ 'group', 'repository' ],
   *   exports: app => { ... },
   * }
   * ```
   *
   * `Properties` is an array that contains the directory of a filepath.
   *
   * `Exports` depends on type, if exports is a function, it will be called. if initializer is specified, it will be called with exports for customizing.
   * @return {Array} items
   * @since 1.0.0
   */
  parse() {
    // ...
}

module.exports = FileLoader;

```

### 上下文加载器 ContextLoader

上下文加载器`ContextLoader`，主要继承了 文件加载器 `FilerLoader` ，功能使用方式和文件加载器`FilerLoader`一致。唯一区别不同的是`ContextLoader`会将加载后的内容挂载到`this.ctx`上。

例如：将`app/service/`目录下所有层级的`*/**.js`文件都加载，封装成`service`对象，挂载到`this.ctx`对象上。

为什么要有一个上下文加载器将内容挂载到 `this.ctx`上呢？

设想一下在写`Controller`的时候，`Service`内容是都是挂载到`this.app`上，那么就会出现在`Controller`方法中没有合适的途径可以拿到`Service`的方法，所以就需要有个依赖的挂载宿主用来挂载`Service`，这个时候`this.ctx`就是最合适的挂载宿主了。

```js
// app/controller/post.js
module.exports = {
  async create(ctx) {
    // do somthing
    const { service } = ctx;
    let result = service.post.createData({...})
    ctx.body = result
  }
}
module.exports = PostController;
```

### egg核心加载器 EggLoader

egg核心加载器，顾名思义就是`egg-core`的核心了，在该加载器内依赖使用了文件加载器`FileLoader`，上下文加载器`ContextLoader`。按照加载顺序主要功能有一下几点。
 
- 加载项目所有配置文件 Config
- 加载项目扩展 Extend
- 加载项目自定义配置 Custom
- 加载项目`app/service/**/*.js` Service
- 加载项目中间件 Middleware
- 加载项目`app/controller/**/*.js` Controller
- 记载项目路由`app/router.js` Router

## 其他工具

`egg-core` 除了核心的加载器工具外，还封装了几种其他工具

- 上下文基类 `BaseContextClass`
- 通用工具方法集合 `utils/index.js`
- 路由 `Router`
- 顺序处理器 `sequencify`

### 上下文基类 BaseContextClass

该工具类主要用于提供给上下文定义的时候继承和扩展，让其基本的属性格式统一，代码也非常简单易懂。

```js
class BaseContextClass {

  /**
   * @constructor
   * @param {Context} ctx - context instance
   * @since 1.0.0
   */
  constructor(ctx) {
    /**
     * @member {Context} BaseContextClass#ctx
     * @since 1.0.0
     */
    this.ctx = ctx;
    /**
     * @member {Application} BaseContextClass#app
     * @since 1.0.0
     */
    this.app = ctx.app;
    /**
     * @member {Config} BaseContextClass#config
     * @since 1.0.0
     */
    this.config = ctx.app.config;
    /**
     * @member {Service} BaseContextClass#service
     * @since 1.0.0
     */
    this.service = ctx.service;
  }
}
```

### 通用工具方法集合 utils/index.js

通用工具方法集合，就是封装了一些零散的方法，是比较独立的功能集合，该文件内容估计不会很固定，会随着`egg-core`的变更而又一定的变化，但是现有集合的零散的方法不会有大的删改。

### 路由 Router

在前几章已经讲过`Egg.js`内置路由的原理和实现，讲解传送门[Egg.js路由增强](https://github.com/chenshenhai/eggjs-note/blob/master/note/start/router.md)

### 顺序处理器 sequencify

顺序处理器 `sequencify`，这个功能是比较强大的，在`EggLoader`加载插件`Plugin`的时候用得比较多，主要是对插件顺序依赖等进行加载的顺序处理，这个以后会在加载器加载插件的实现会详细讲解。