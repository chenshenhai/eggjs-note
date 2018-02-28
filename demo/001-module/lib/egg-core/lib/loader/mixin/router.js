'use strict';

const path = require('path');

module.exports = {
  loadRouter() {
    // 加载Egg.js应用工程目录的路由
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  },
};
