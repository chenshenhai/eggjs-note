# Egg.js路由增强

从前面两章《Egg.js最小流程》和《Egg.js模块归类》总结出，Egg.js项目的路由实现由两个部分组成:

- egg-core框架的 `Router` 实现 
  - 位置`egg-core/lib/utils/router.js` 
  - 继承了模块 `koa-router`
- Egg.js 项目应用的 路由注册
  - 位置`app/router.js`
  - 注册项目的所有路由

Egg.js 项目路由的注册和使用在 [Egg.js官方教程·Router 路由](https://eggjs.org/zh-cn/basics/router.html) 中已经讲述的很清楚了。今天这一章主要是将 `egg-core`框架的路由实现和增强使用。

## koa-router 原有功能

- koa-router原生功能
  - get
  - post
  - put
  - del
  - ...

因为Egg.js的`EggCore.router`模块继承了`koa-router`模块的路由，所以`koa-router`原有的路由能力，Egg.js都有。

Egg.js将`EggCore.Router`从原始版本就将`koa-router`的原生方法代理到`this.app`中，所以一开始就可以直接使用`app.get(...)`、`app.post(...)`等方式去注册路由，随着Egg.js能力的增加挂载在`this.app`上的方法越来越多。为了更加方便使用和API的梳理，官方建议路由的使用方式是用`app.router.get(...)`、`app.router.post(...)`等该类似的格式使用。


> 因为Egg.js的基础路由功能是继承自`koa-router`，这一章主要讲Egg.js对路由增强的能力，原生路由的能力可以去`koa-router` [https://github.com/alexmingoia/koa-router/](https://github.com/alexmingoia/koa-router/) 模块仓库查看底层实现原理。


## 路由初始化过程

- 继承 `koa-router`
- 兼容`koa-router`路由的中间件使用
- 封装所有`controller`
  - 封装兼容`Generator Function`
  - 通过 controller 句柄读取`this.app.controller`中对应的`contorller`


## egg-core 增强功能

Egg.js的`egg-core`路由增强能力有一下几点

- 路由大小写敏感
- RESTFul实现
- Generator Function 兼容
- Controller的句柄使用

### 大小写敏感

因为`koa-router`模块代码关闭了路由的大小敏感 [https://github.com/alexmingoia/koa-router/blob/master/lib/layer.js#L15](https://github.com/alexmingoia/koa-router/blob/master/lib/layer.js#L15)，`egg-core`在一开始`router`初始化的时候，就开启了大小写敏感的功能 `new Router({ sensitive: true }, this)`。

```js
class EggCore extends Koa {

  constructor(options) {
    // ...
  }

  // ...

  get router() {
    if (this[ROUTER]) {
      return this[ROUTER];
    }

    // 开启路由大小写敏感
    const router = this[ROUTER] = new Router({ sensitive: true }, this);
    // register router middleware
    this.beforeStart(() => {
      this.use(router.middleware());
    });
    return router;
  }

  // ...
}

```


### RESTFul实现

`koa-router` 本身不自带RESTFul能力，Egg.js是面向企业应用而设计的，RESTFul能力是服务API开发的基本能力。因此，Egg.js的路由提供了 `router.resources('routerName', 'pathMatch', controller)` 的方法去约定和处理 RESTFul 的实现

#### RESTFul约定

- `routerName` RESTFul 路由名称 例如 `posts`
- `pathMatch` RESTFul 基础路由路径，例如 `/posts`
- `controller` 路由执行控制器集合
  - `controller.index` 对应 `GET` 请求的 `/posts` 路径
  - `controller.new` 对应 `GET` 请求的 `/posts/new` 路径
  - `controller.show` 对应 `GET` 请求的 `/posts/:id` 路径
  - `controller.edit` 对应 `GET` 请求的 `/posts/:id/edit` 路径
  - `controller.create` 对应 `POST` 请求的 `/posts` 路径
  - `controller.update` 对应 `PATCH` 请求的 `/posts/:id` 路径
  - `controller.destroy` 对应 `DELETE` 请求的 `/posts/:id` 路径

#### RESTFul实现源码

- 约定路由路径和对应的控制器
- 统一处理封装router的参数 
- 根据请求类型和路径注册对应的控制器
  - 统一封装controller
    - `Async Function`
    - `Generator Function`
    - controller句柄读取`this.app.controller` 

```js

const REST_MAP = {
  index: {
    suffix: '',
    method: 'GET',
  },
  new: {
    namePrefix: 'new_',
    member: true,
    suffix: 'new',
    method: 'GET',
  },
  create: {
    suffix: '',
    method: 'POST',
  },
  show: {
    member: true,
    suffix: ':id',
    method: 'GET',
  },
  edit: {
    member: true,
    namePrefix: 'edit_',
    suffix: ':id/edit',
    method: 'GET',
  },
  update: {
    member: true,
    namePrefix: '',
    suffix: ':id',
    method: [ 'PATCH', 'PUT' ],
  },
  destroy: {
    member: true,
    namePrefix: 'destroy_',
    suffix: ':id',
    method: 'DELETE',
  },
};

class Router extends KoaRouter {

  // ....

  /**
   * restful router api
   * @param {String} name - Router name
   * @param {String} prefix - url prefix
   * @param {Function} middleware - middleware or controller
   * @return {Router} return route object.
   */
  resources(...args) {
    // 统一处理封装router的参数
    const splited = spliteAndResolveRouterParams({ args, app: this.app });
    const middlewares = splited.middlewares;
    // last argument is Controller object
    const controller = splited.middlewares.pop();

    let name = '';
    let prefix = '';
    if (splited.prefix.length === 2) {
      // router.get('users', '/users')
      name = splited.prefix[0];
      prefix = splited.prefix[1];
    } else {
      // router.get('/users')
      prefix = splited.prefix[0];
    }

    for (const key in REST_MAP) {
      const action = controller[key];
      if (!action) continue;

      const opts = REST_MAP[key];
      let formatedName;
      if (opts.member) {
        formatedName = inflection.singularize(name);
      } else {
        formatedName = inflection.pluralize(name);
      }
      if (opts.namePrefix) {
        formatedName = opts.namePrefix + formatedName;
      }
      prefix = prefix.replace(/\/$/, '');
      const path = opts.suffix ? `${prefix}/${opts.suffix}` : prefix;
      const method = Array.isArray(opts.method) ? opts.method : [ opts.method ];
      this.register(path, method, middlewares.concat(action), { name: formatedName });
    }
    return this;
  }

  // ....

}
// ....
```



## 源码实现

- demo传送门 [https://github.com/chenshenhai/eggjs-note/tree/master/demo/001-router](https://github.com/chenshenhai/eggjs-note/tree/master/demo/001-router)

- demo 核心路由源码 [https://github.com/chenshenhai/eggjs-note/blob/master/demo/001-router/lib/egg-core/lib/utils/router.js](https://github.com/chenshenhai/eggjs-note/blob/master/demo/001-router/lib/egg-core/lib/utils/router.js)

### 运行demo

```sh
cd eggjs-note/001-router/

npm i

npm start
```





