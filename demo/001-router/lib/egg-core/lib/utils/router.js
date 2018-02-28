'use strict';

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const is = require('is-type-of');

const methods = [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete', 'all' ];

// Router start
class Router extends KoaRouter {
  constructor(opts, app) {
    super(opts);
    this.app = app;
  }

  patchRouterMethod() {
    methods.forEach(method => {
      this[method] = (...args) => {
        let prefix;
        let middlewares;
        if (args.length >= 3 && (is.string(args[1]) || is.regExp(args[1]))) {
          // app.get(name, url, [...middleware], controller)
          prefix = args.slice(0, 2);
          middlewares = args.slice(2);
        } else {
          // app.get(url, [...middleware], controller)
          prefix = args.slice(0, 1);
          middlewares = args.slice(1);
        }
        // resolve controller
        const controller = middlewares.pop();
        middlewares.push(controller);
        super[method] = prefix.concat(middlewares);
      };
    });
  }
}
// Router end

module.exports = Router;
