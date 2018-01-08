'use strict';
const path = require('path');
const utils = require('../../utils');


module.exports = {
  loadRouter() {
    // TODO
    console.log('[loader]: loadRouter');

    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  },
};
