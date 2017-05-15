String.prototype.encodeHTML = function() {
  var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
      matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
  return function() {
    return this ? this.replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : this;
  };
}();
