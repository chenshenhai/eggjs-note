'use strict';

const Egg = require('./lib/egg');

const app = new Egg({
  baseDir: __dirname,
  type: 'application',
});

const server = require('http').createServer(app.callback());
server.once('error', err => {
  console.log('[app_worker] server got error: %s, code: %s', err.message, err.code);
  process.exit(1);
});
server.listen(7001, () => {
  console.log('server started at 7001');
});
