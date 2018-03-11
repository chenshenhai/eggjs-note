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
}
// Router end

module.exports = Router;
