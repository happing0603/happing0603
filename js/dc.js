/* Minimal template runtime: {{ holes }}, <sc-if>, <sc-for>, onClick handlers, DOM patching. */
(function () {
  var HOLE = /\{\{\s*([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}/g;
  var SOLE = /^\s*\{\{\s*([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}\s*$/;

  function lookup(scope, path) {
    var p = path.split('.'), v = scope;
    for (var i = 0; i < p.length; i++) {
      if (v == null) return undefined;
      v = v[p[i]];
    }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, k) {
      var v = lookup(scope, k);
      return v == null || typeof v === 'function' ? '' : String(v);
    });
  }
  function wire(el) {
    el.onclick = function (e) { if (el._click) el._click(e); };
  }
  function build(src, scope, out) {
    for (var n = src.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { out.appendChild(document.createTextNode(interp(n.nodeValue, scope))); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.localName;
      if (tag === 'sc-if') {
        var m = SOLE.exec(n.getAttribute('value') || '');
        if (m && lookup(scope, m[1])) build(n, scope, out);
        continue;
      }
      if (tag === 'sc-for') {
        var m2 = SOLE.exec(n.getAttribute('list') || '');
        var list = (m2 && lookup(scope, m2[1])) || [];
        var as = n.getAttribute('as') || 'item';
        for (var i = 0; i < list.length; i++) {
          var s = Object.create(scope);
          s[as] = list[i];
          s.$index = i;
          build(n, s, out);
        }
        continue;
      }
      var el = document.createElementNS(n.namespaceURI, n.localName);
      for (var j = 0; j < n.attributes.length; j++) {
        var a = n.attributes[j];
        var name = a.name;
        if (name.indexOf('hint-') === 0) continue;
        if (name.toLowerCase() === 'onclick') {
          var sm = SOLE.exec(a.value);
          var fn = sm ? lookup(scope, sm[1]) : null;
          if (typeof fn === 'function') { el._click = fn; wire(el); }
          continue;
        }
        el.setAttribute(name, interp(a.value, scope));
      }
      build(n, scope, el);
      out.appendChild(el);
    }
  }
  function syncAttrs(a, b) {
    var i, at;
    for (i = 0; i < b.attributes.length; i++) {
      at = b.attributes[i];
      if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    }
    for (i = a.attributes.length - 1; i >= 0; i--) {
      at = a.attributes[i];
      if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    }
  }
  function morph(o, n) {
    var nl = Array.prototype.slice.call(n.childNodes);
    for (var i = 0; i < nl.length; i++) {
      var a = o.childNodes[i], b = nl[i];
      if (!a) { o.appendChild(b); continue; }
      if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { o.replaceChild(b, a); continue; }
      if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; continue; }
      syncAttrs(a, b);
      if (b._click) { a._click = b._click; if (!a.onclick) wire(a); } else { a._click = null; }
      morph(a, b);
    }
    while (o.childNodes.length > nl.length) o.removeChild(o.lastChild);
  }

  function DCLogic() { this.state = {}; this.props = {}; }
  DCLogic.prototype.setState = function (p) {
    this.state = Object.assign({}, this.state, p);
    if (this._ready) this._render();
  };

  window.DCLogic = DCLogic;
  window.DC = {
    mount: function (C) {
      var tpl = document.getElementById('dc-tpl');
      var app = document.getElementById('app');
      var inst = new C();
      inst._render = function () {
        var vals = inst.renderVals();
        var out = document.createElement('div');
        build(tpl.content, vals, out);
        morph(app, out);
      };
      inst._ready = true;
      inst._render();
      if (inst.componentDidMount) inst.componentDidMount();
      window.addEventListener('pagehide', function () {
        if (inst.componentWillUnmount) inst.componentWillUnmount();
      });
    }
  };
})();
