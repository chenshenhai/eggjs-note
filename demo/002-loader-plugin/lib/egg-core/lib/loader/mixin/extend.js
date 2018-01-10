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
        // Copy descriptor
        let descriptor = Object.getOwnPropertyDescriptor(ext, property);
        let originalDescriptor = Object.getOwnPropertyDescriptor(proto, property);


        if (!originalDescriptor) {
          // try to get descriptor from originalPrototypes
          const originalProto = originalPrototypes[name];
          if (originalProto) {
            originalDescriptor = Object.getOwnPropertyDescriptor(originalProto, property);
          }
        }
        if (originalDescriptor) {
          // don't override descriptor
          descriptor = Object.assign({}, descriptor);
          if (!descriptor.set && originalDescriptor.set) {
            descriptor.set = originalDescriptor.set;
          }
          if (!descriptor.get && originalDescriptor.get) {
            descriptor.get = originalDescriptor.get;
          }
        }
        Object.defineProperty(proto, property, descriptor);

      }

    }
  },
};
