'use strict';

var tmplEngine = require('art-template/dist/template.js');
var tmplEnginePath = require.resolve('art-template/dist/template.js');

module.exports = function(source) {
  var asyncCallback = this.async();
  var loaderCallback = asyncCallback || this.callback;
  var result;

  toThrowTemplateError();

  try {
    result = 'var engine = require('
              + JSON.stringify(tmplEnginePath) + ');\n'
              + 'module.exports = ('
              + tmplEngine.render(source).toString()
              + ').bind(engine.utils)';
    loaderCallback(null, result);
  } catch(error) {
    loaderCallback(error);
  }

};

function toThrowTemplateError() {
  var _oldOnError = tmplEngine.onerror;

  tmplEngine.onerror = function(e) {
    _oldOnError.call(this, e);
    // TODO: 把错误信息填充到 SyntaxError 对象中
    throw new SyntaxError();
  };
}