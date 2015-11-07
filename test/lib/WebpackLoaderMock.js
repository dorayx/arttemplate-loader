var WebpackLoaderMock = function(options) {
  this.asyncCallback = function (error, result) {
    // 由于 arttmpl-loader 可能捕捉 async 方法抛出的异常
    // 导致 assertion 抛出异常后会重新回到 async 方法
    // 所以这里需要把捕捉到的异常再次抛出
    if (error) throw error;
    return options.async.call(this, null, result);
  }
};


WebpackLoaderMock.prototype.async = function() {
  return this.asyncCallback;
};


module.exports = WebpackLoaderMock;