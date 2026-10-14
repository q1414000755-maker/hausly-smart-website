/* Shared Variant Resolver — Stage 07-01
   One matching contract for Product Detail, Quote Drawer, Quote List and RFQ.
   It never invents combinations and never falls back to a previous variant. */
(function (global) {
  "use strict";

  var asArray = function (value) {
    if (value == null || value === "") return [];
    return Array.isArray(value) ? value.map(String) : [String(value)];
  };

  var attrsOf = function (variant) {
    return (variant && (variant.attributes || variant.attrs)) || {};
  };

  var normalise = function (attrs) {
    var out = {};
    if (!attrs || typeof attrs !== "object") return out;
    Object.keys(attrs).forEach(function (key) {
      var values = asArray(attrs[key]);
      if (values.length) out[key] = values;
    });
    return out;
  };

  var variantId = function (variant) {
    return String((variant && (variant.variant_id || variant.id || variant._v)) || "");
  };

  var variantsOf = function (record) {
    return record && Array.isArray(record.variants) ? record.variants : [];
  };

  var matches = function (variant, selection) {
    var attrs = attrsOf(variant);
    return Object.keys(selection || {}).every(function (key) {
      var wanted = asArray(selection[key]);
      if (!wanted.length) return true;
      var available = asArray(attrs[key]);
      return wanted.every(function (value) { return available.indexOf(value) >= 0; });
    });
  };

  var candidates = function (record, selection) {
    var wanted = normalise(selection);
    return variantsOf(record).filter(function (variant) { return matches(variant, wanted); });
  };

  var byId = function (record, id) {
    var key = String(id || "");
    if (!key) return null;
    return variantsOf(record).filter(function (variant) { return variantId(variant) === key; })[0] || null;
  };

  var preferred = function (record, list, preferredId) {
    var wanted = String(preferredId || (record && record.primary_variant) || "");
    if (!wanted) return null;
    return list.filter(function (variant) { return variantId(variant) === wanted; })[0] || null;
  };

  var resolve = function (record, selection, options) {
    var opts = options || {};
    if (!record) return null;
    if (opts.variantId) {
      var identified = byId(record, opts.variantId);
      return identified && matches(identified, normalise(selection)) ? identified : null;
    }
    var list = candidates(record, selection);
    if (!list.length) return null;
    if (list.length === 1) return list[0];
    if (opts.allowDefault === false) return null;
    return preferred(record, list, opts.preferredId) || list[0];
  };

  var resolveExact = function (record, selection, options) {
    var opts = options || {};
    if (!record) return null;
    if (opts.variantId) {
      var identified = byId(record, opts.variantId);
      return identified && matches(identified, normalise(selection)) ? identified : null;
    }
    var list = candidates(record, selection);
    return list.length === 1 ? list[0] : null;
  };

  var availableValues = function (record, selection, key) {
    var values = {};
    var base = normalise(selection);
    delete base[key];
    candidates(record, base).forEach(function (variant) {
      asArray(attrsOf(variant)[key]).forEach(function (value) { values[value] = true; });
    });
    return Object.keys(values);
  };

  var selectionFromVariant = function (variant) {
    var source = attrsOf(variant);
    var out = {};
    Object.keys(source).forEach(function (key) {
      var values = asArray(source[key]);
      if (values.length) out[key] = values;
    });
    return out;
  };

  global.Z02_VARIANT_RESOLVER = {
    asArray: asArray,
    normalise: normalise,
    attrsOf: attrsOf,
    variantId: variantId,
    candidates: candidates,
    byId: byId,
    resolve: resolve,
    resolveExact: resolveExact,
    availableValues: availableValues,
    selectionFromVariant: selectionFromVariant
  };
})(window);
