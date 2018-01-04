const Application = require('./lib');

const app = new Application({
  baseDir: __dirname,
  type: 'application',
});

app.loader.loadAll();

app.listen(7001);
console.log('server started at 7001');