var g;

g = (function() {
  return this; 
})();

try {
  g = g || new Function('return this')();
} catch (e) {
  if (typeof window === 'object') g = window;
}

module.exports = g;
