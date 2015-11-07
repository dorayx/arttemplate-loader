'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var should = chai.should();
chai.use(sinonChai);

var fs = require('fs');
var path = require('path');

var arttemplate = require('art-template/dist/template.js');
var arttmplLoader = require('../index.js');

var WebpackLoaderMock = require('./lib/WebpackLoaderMock.js');

var CR = /\r/g;

var SIMPLE_TEMPLATE_DATA = {
  greeting: 'Hello World'
};


describe('arttmpl-loader', function() {

  it("should compile the template file", function() {
    var templateSource = readTemplate('./simple.tmpl');
    var engineResult = engineCompile(templateSource)(SIMPLE_TEMPLATE_DATA);

    var loaderCallback = function(error, loaderSource) {
      renderTemplate(loaderSource, {
        data: SIMPLE_TEMPLATE_DATA,
        test: function(loaderResult, _module, _require) {
          _require.should.have.been.calledOnce;
          loaderResult.should.equal(engineResult);
        }
      });
    };

    runLoader({callback: loaderCallback, source: templateSource});
  });


  it('should throw a TypeError when some rendered data is undefined', function() {
    var templateSource = readTemplate('./data-error.tmpl');

    var loaderCallback = function(error, loaderSource) {
      (function whenRenderingTemplate() {
        renderTemplate(loaderSource, {
          data: SIMPLE_TEMPLATE_DATA,
          test: function() {}
        });
      }).should.throw(TypeError);
    };

    runLoader({callback: loaderCallback, source: templateSource});
  });


  it('should throw a template error when the syntax is error', function() {
    var templateSource = readTemplate('./syntax-error.tmpl');

    // 20150719: 由于重写了 template.onerror 方法，
    // 当遇到语法解析错误时，将抛出 SyntaxError，
    // 因此不需要 stub console.error 了
    sinon.stub(console, 'error', function(message) {
      // DEPRECATED
      // arttemplate 编译模板错误时并没有抛出异常
      // 而是调用 console.error 向控制台输出带有 Template Error 的错误
      // if (/Template\sError/.test(message)) {
      //   throw TemplateError;
      // }
    });

    (function whenRunningLoader() {
      runLoader({callback: function() {}, source: templateSource});
    }).should.throw(SyntaxError);
  });

});


function readTemplate(templatePath) {
  return fs.readFileSync(
    path.join(__dirname, templatePath),
    'utf8'
  ).replace(CR, '');
}


function renderTemplate(loaderSource, options) {
  var _module = {};
  var _require = sinon.spy(function(resource) {
    return require(resource);
  });
  var templateData = options.data;
  var testCallback = options.test;
  var loaderExports;
  var loaderFunction;
  var loaderResult;

  loaderFunction = new Function('module', 'require', loaderSource);
  loaderFunction(_module, _require);
  loaderExports = _module.exports;

  loaderResult = loaderExports(templateData);

  testCallback(loaderResult, _module, _require);
}


function engineCompile(templateSource) {
  return arttemplate.render(templateSource);
}


function runLoader(options) {
  var webpack = new WebpackLoaderMock({
    async: options.callback
  });

  arttmplLoader.call(webpack, options.source);
}

