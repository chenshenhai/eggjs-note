'use strict';


const controller = {

  page: {
    async index(ctx) {
      ctx.body = 'This is index page!';
    },

    async hello(ctx) {
      ctx.body = 'This is hello page!';
    },
  },

  api: {
    async index(ctx) {
      ctx.body = {
        action: 'index',
      };
    },

    async new(ctx) {
      ctx.body = {
        action: 'new',
      };
    },

    async show(ctx) {
      ctx.body = {
        action: 'show',
      };
    },

    async edit(ctx) {
      ctx.body = {
        action: 'edit',
      };
    },

    async create(ctx) {
      ctx.body = {
        action: 'create',
      };
    },

    async update(ctx) {
      ctx.body = {
        action: 'update',
      };
    },

    async destroy(ctx) {
      ctx.body = {
        action: 'destroy',
      };
    },

  },

};

module.exports = app => {

  const router = app.router;

  router.get('/', controller.page.index);
  router.get('/hello', controller.page.hello);
  router.resources('posts', '/api/posts', controller.api);

};
