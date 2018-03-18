'use strict';

module.exports = {
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

};
