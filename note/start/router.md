# Egg.js路由增强

从前面两章《Egg.js最小流程》和《Egg.js模块归类》总结出，Egg.js项目的路由实现由两个部分组成:

- egg-core框架的 `Router` 实现 
  - 位置`egg-core/lib/utils/router.js` 
  - 继承了模块 `koa-router`
- Egg.js 项目应用的 路由注册
  - 位置`app/router.js`
  - 注册项目的所有路由

Egg.js 项目路由的注册和使用在 [Egg.js官方教程·Router 路由](https://eggjs.org/zh-cn/basics/router.html) 这一节中，已经讲述的很清楚了。今天这一章主要是将 `egg-core`框架的路由实现和增强使用。

## koa-router 原有功能
- koa-router原生功能
  - get
  - post
  - put
  - del

## egg-core 增强功能

- 大小写敏感
- RESTFul实现
- Generator Function 兼容


## 其他兼容功能

## 源码实现