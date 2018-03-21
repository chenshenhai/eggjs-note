'use strict';

const fs = require('fs');
const path = require('path');
const globby = require('globby');
const FULLPATH = Symbol('EGG_LOADER_ITEM_FULLPATH');
const EXPORTS = Symbol('EGG_LOADER_ITEM_EXPORTS');

const defaults = {
  directory: null,
  target: null,
  match: undefined,
  ignore: undefined,
  lowercaseFirst: false,
  caseStyle: 'camel',
  initializer: null,
  call: true,
  override: false,
  inject: undefined,
  filter: null,
};

/**
 * Load files from directory to target object.
 * @since 1.0.0
 */
class FileLoader {

  constructor(options) {
    this.options = Object.assign({}, defaults, options);
  }

  /**
   * attach items to target object. Mapping the directory to properties.
   * `app/controller/group/repository.js` => `target.group.repository`
   * @return {Object} target
   * @since 1.0.0
   */
  load() {
    const items = this.parse();
    const target = this.options.target;
    for (const item of items) {
      target[item.properties[0]] = item.exports;
    }
    return target;
  }

  parse() {
    const files = this.options.match || [ '**/*.js' ];

    const directory = this.options.directory;

    const items = [];
    const filepaths = globby.sync(files, { cwd: directory });
    for (const filepath of filepaths) {
      const fullpath = path.join(directory, filepath);
      if (!fs.statSync(fullpath).isFile()) continue;
      const properties = [ filepath.substring(0, filepath.lastIndexOf('.')).split('/').pop() ];
      const exports = require(fullpath);
      if (exports == null) continue;

      items.push({ fullpath, properties, exports });
    }
    return items;
  }

}

module.exports = FileLoader;
module.exports.EXPORTS = EXPORTS;
module.exports.FULLPATH = FULLPATH;

