'use strict';

module.exports = {
  get plugin3_req_func() {
    return function() {
      console.log('this is plugin3_req_func');
    };
  },
};
