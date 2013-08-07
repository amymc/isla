/*
  Library
  Defines the Isla built in library of functions and types.
*/

;(function(exports) {
  var Isla, _, multimethod;
  if(typeof module !== 'undefined' && module.exports) { // node
    _ = require("Underscore");
    multimethod = require('multimethod');
    Isla = {};
    Isla.Utils = require('./utils').Utils;
  } else { // browser
    _ = window._;
    multimethod = window.multimethod;
    Isla = window.Isla;
  }

  exports.Library = {};

  var getInitialEnv = function() {
    var islaCtx = {
      write: {
        fn: function(env, param) {
          if(Isla.Utils.type(param) === "Object") {
            return param.toString();
          } else {
            return param + "\n";
          }
        },

        description: function(p) {
          return "Writes out " + p + ".";
        }
      },

      _types: {
        list: function() {
          return new List();
        },

        generic: function() {
          return new Generic();
        }
      }
    };

    return {
      ret: null,
      ctx: islaCtx,
      clone: function() {
        var e = getInitialEnv();
        e.ret = clone(this.ret);
        e.ctx = clone(this.ctx);
        return e;
      }
    };
  };

  var clone = function(o) {
    if (o instanceof List || o instanceof Generic) {
      return o.clone();
    } else if (Isla.Utils.type(o) === "Array") {
      var c = [];
      for (var i = 0; i < o.length; i++) {
        c[i] = clone(o[i]);
      }
      return c;
    } else if (Isla.Utils.type(o) === "Object") {
      var c = {};
      extendObj(o, c);
      return c;
    } else if (Isla.Utils.type(o) === "String") {
      return o;
    } else {
      return undefined;
    }
  };

  var extendObj = function(from, to) {
    for (var i in from) {
      if (from.hasOwnProperty(i)) {
        to[i] = clone(from[i]);
      }
    }
  };

  var Generic = function() {};

  Generic.prototype = {
    constructor: Generic,

    toString: function(indent) {
      if (!indent) {
        indent = "  ";
      }

      var out = "a " + this._meta.type + "\n";
      for (var i in this) {
        if (Isla.Utils.type(this[i]) !== "Function" && i !== "_meta") {
          if(Isla.Utils.type(this[i]) === "Object") {
            out += indent + i + " is " + this[i].toString(indent + "  ");
          } else {
            out += indent + i + " is '" + this[i] + "'\n";
          }
        }
      }

      return out;
    },

    clone: function() {
      var c = new Generic();
      extendObj(this, c);
      return c;
    }
  };

  var List = function() {
    this.data = [];
  };

  List.prototype = {
    constructor: List,

    add: multimethod()
      .dispatch(function(thing) {
        return Isla.Utils.type(thing);
      })

      // note: will always be refs unless part of list that is being resolved
      .when("Object", function(thing) {
        for(var i = 0; i < this.data.length; i++) {
          if (thing === this.data[i]) {
            return;
          }
        }

        this.data.push(thing);
      })

      .default(function(thing) {
        this.data.push(thing);
      }),

    take: multimethod()
      .dispatch(function(thing) {
        return Isla.Utils.type(thing);
      })

      // note: will always be refs unless part of list that is being resolved
      .when("Object", function(thing) {
        // can't reject dupes where one resolved other ref - haven't got env
        for(var i = 0; i < this.data.length; i++) {
          if (thing === this.data[i]) {
            this.data.splice(i, 1);
            break;
          }
        }
      })

      .default(function(thing) {
        for(var i = 0; i < this.data.length; i++) {
          if(thing === this.data[i]) {
            this.data.splice(i, 1);
            break;
          }
        }
      }),

    items: function() {
      return this.data;
    },

    toString: function(indent) {
      if (!indent) {
        indent = "  ";
      }

      if (this.items().length === 0) {
        return "an empty list"
      } else {
        var out = "a list\n"
        for (var i = 0; i < this.items().length; i++) {
          if(Isla.Utils.type(this.items()[i]) === "Object") {
            out += indent + this.items()[i].toString(indent + "  ");
          } else {
            out += indent + "'" + this.items()[i] + "'\n";
          }
        }

        return out;
      }
    },

    clone: function() {
      var c = new List();
      c.data = clone(this.data);
      return c;
    }
  };

  exports.Library.List = List;
  exports.Library.Generic = Generic;
  exports.Library.getInitialEnv = getInitialEnv;
})(typeof exports === 'undefined' ? this.Isla : exports);
