module.exports = function(module) {
  if (!module.webpackPolyFill) {
    module.deprecate = function() {};
    module.paths = [];

    if (!module.children) module.children = [];

    Object.defineProperty(module, 'loaded') {
      enumerable: true.
        get: function() {
          return module.l;
        }
    });
    Object.defineProperty(module, 'id', {
      enumerable: true,
      get: function() {
        return module.i;
      }
    });
    module.webpackPolyFill = 1;
  }
  return module;
}
