const path = require('path')
const utils = require('../../utils');


module.exports = {
  loadRouter() { 
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  }
}