'use strict';

const convert = require('koa-convert');
const is = require('is-type-of');
const path = require('path');
const fs = require('fs');
const co = require('co');

module.exports = {

  loadFile(filepath) {
    try {
      // if not js module, just return content buffer
      const extname = path.extname(filepath);
      if (![ '.js', '.node', '.json', '' ].includes(extname)) {
        return fs.readFileSync(filepath);
      }
      // require js module
      const obj = require(filepath);
      if (!obj) return obj;
      // it's es module
      if (obj.__esModule) return 'default' in obj ? obj.default : obj;
      return obj;
    } catch (err) {
      err.message = `[egg-core] load file: ${filepath}, error: ${err.message}`;
      throw err;
    }
  },

  resolveModule(filepath) {
    try {
      return require.resolve(filepath);
    } catch (e) {
      return undefined;
    }
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

  async callFn(fn, args, ctx) {
    args = args || [];
    if (!is.function(fn)) return;
    if (is.generatorFunction(fn)) fn = co.wrap(fn);
    return ctx ? fn.call(ctx, ...args) : fn(...args);
  },

  middleware(fn) {
    return is.generatorFunction(fn) ? convert(fn) : fn;
  },

  getCalleeFromStack(withLine) {
    const limit = Error.stackTraceLimit;
    const prep = Error.prepareStackTrace;

    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = 4;

    // capture the stack
    const obj = {};
    Error.captureStackTrace(obj);
    let callSite = obj.stack[2];
    let fileName;

    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;

    /* istanbul ignore if */
    if (!callSite || !fileName) return '<anonymous>';
    if (!withLine) return fileName;
    return `${fileName}:${callSite.getLineNumber()}:${callSite.getColumnNumber()}`;
  },
};

 

function prepareObjectStackTrace(obj, stack) {
  return stack;
}