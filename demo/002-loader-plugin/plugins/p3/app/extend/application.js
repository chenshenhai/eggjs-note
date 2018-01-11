'use strict';

module.exports = {
  get plugin3_app_func() {
    return function() {
      console.log('this is plugin3_app_func');
    };
  },
};
