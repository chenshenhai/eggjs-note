'use strict';

module.exports = {
  async index(ctx) {
    ctx.body = 'This is index page!';
  },

  async hello(ctx) {
    ctx.body = 'This is hello page!';
  },
};
