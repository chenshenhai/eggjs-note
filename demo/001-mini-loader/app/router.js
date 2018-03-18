'use strict';


module.exports = app => {

  const router = app.router;
  const controller = app.controller;

  router.get('/', controller.page.index);
  router.get('/hello', controller.page.hello);
  router.resources('posts', '/api/posts', controller.api);

};
