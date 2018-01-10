'use strict';
module.exports = app => {

  app.get('/index', async ctx => {
    ctx.body = 'hello index';
  });
  app.get('/', async ctx => {
    ctx.body = 'hello world';
  });

  app.p3_func()
};
