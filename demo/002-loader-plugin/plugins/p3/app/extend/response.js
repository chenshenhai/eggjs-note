'use strict';

module.exports = {
  get plugin3_res_func() {
    return function() {
      console.log('this is plugin3_res_func');
    };
  },
};
