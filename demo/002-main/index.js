const Application = require('./lib/egg').Application;

const app = new Application({
  baseDir: __dirname,
  type: 'application',
});

app.listen(7001);
console.log('server started at 7001');