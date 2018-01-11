'use strict';
const fs = require('fs');
const path = require('path');
const utils = require('../../utils');

const originalPrototypes = {
  request: require('koa/lib/request'),
  response: require('koa/lib/response'),
  context: require('koa/lib/context'),
  application: require('koa/lib/application'),
};

module.exports = {

  loadApplicationExtend() {
    this.loadExtend('application', this.app);
  },

  loadRequestExtend() {
    this.loadExtend('request', this.app.request);
  },

  loadResponseExtend() {
    this.loadExtend('response', this.app.response);
  },

  loadContextExtend() {
    this.loadExtend('context', this.app.context);
  },


  getExtendFilePaths(name) {
    return this.getLoadUnits().map(unit => path.join(unit.path, 'app/extend', name));
  },

  loadExtend(name, proto) {
    const filepaths = this.getExtendFilePaths(`${name}.js`);

    for (const filepath of filepaths) {
      if (!fs.existsSync(filepath)) {
        continue;
      }
      const ext = utils.loadFile(filepath);

      const properties = Object.getOwnPropertyNames(ext).concat(Object.getOwnPropertySymbols(ext));

      for (const property of properties) {
        const descriptor = Object.getOwnPropertyDescriptor(ext, property);
        Object.defineProperty(proto, property, descriptor);
      }
    }
  },

};
