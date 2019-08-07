'use strict';

var bundle = require('../vendor/bundle.js');
var Session = bundle.Session;
var Socket = bundle.Socket;
var Messages = bundle.Messages;

var siteID = null;
var sessionIDHeader = 'X-Session-Id';
var browserCheck =
  navigator.doNotTrack != '1' &&
  !window.doNotTrack &&
  Array.prototype.every &&
  'MutationObserver' in window &&
  'crypto' in window &&
  'performance' in window &&
  'timing' in performance;

function init(opts) {
  if (typeof opts !== 'object') {
    console.error('asayer: missing or wrong options for init');
    return;
  }
  if (siteID !== null) {
    console.warn('asayer: package was already initialized');
    return;
  }
  siteID = parseInt(opts.siteID, 10);
  if (isNaN(siteID)) {
    siteID = null;
    console.error('asayer: missing or wrong siteID');
    return;
  }
  if (opts.hasOwnProperty('fetch')) {
    if (opts.fetch.sessionIDHeader) {
      sessionIDHeader = opts.fetch.sessionIDHeader;
    }
  }
  Session.siteID = siteID;
  if (browserCheck) {
    Session.init();
  }
}

function vars(k, v) {
  if (v === undefined) {
    if (k === null || typeof k !== 'object' || Array.isArray(k)) {
      console.warn(
        'asayer: vars wrong first param %o. Should be an object.',
        k,
      );
      return;
    }
    for (var t in k)
      if (k.hasOwnProperty(t)) {
        vars(t, k[t]);
      }
    return;
  }
  if (typeof k !== 'string') {
    console.warn('asayer: vars wrong first param %o. Should be a string.', k);
    return;
  }
  if (v === null) {
    Messages.setUserVar(k, '');
    return;
  }
  switch (typeof v) {
    case 'string':
      Messages.setUserVar(k, v);
      break;
    case 'number':
      if (!isFinite(v)) {
        console.warn(
          'asayer: vars wrong second param %o. Should be finite.',
          v,
        );
        break;
      }
      Messages.setUserVar(k, v.toString());
      break;
    case 'boolean':
      Messages.setUserVar(k, v.toString());
      break;
    default:
      console.warn('asayer: vars wrong second param %o.', v);
  }
}

function event(n, p) {
  if (typeof n !== 'string') {
    console.warn('asayer: event wrong first param %o. Should be a string.', n);
    return;
  }
  if (p === undefined) {
    p = null;
  }
  if (typeof p !== 'object' || Array.isArray(p)) {
    console.warn('asayer: event wrong second param %o. Should be a hash.', p);
    return;
  }
  Messages.userEvent(n, JSON.stringify(p));
}

function start() {
  Session.record = true;
  Socket.connect();
}

function started() {
  return Session.record;
}

function id() {
  if (Session.sessionID === null) {
    return undefined;
  }
  if (Session.sessionID === '') {
    return null;
  }
  return Session.sessionID;
}

function method(fn, def) {
  return function() {
    if (siteID === null) {
      console.error('asayer: package was not initialized');
      return def;
    }
    if (!browserCheck) {
      return def;
    }
    return fn.apply(null, arguments);
  };
}

function fetch(resource, init) {
  if (siteID === null) {
    console.error('asayer: package was not initialized');
    return window.fetch(resource, init);
  }
  if (!browserCheck) {
    return window.fetch(resource, init);
  }
  var sessionID = Session.sessionID;
  if (sessionID) {
    if (init === undefined) {
      init = {
        headers: {},
      };
    }
    init.headers[sessionIDHeader] = sessionID;
  }
  var data = {
    resource: resource,
    payload: init.body,
    method: init.method,
    start_time: performance.now(),
  };
  return window.fetch(resource, init).then(response => {
    var r = response.clone();
    data.status = r.status;
    data.end_time = performance.now();
    r.text().then(text => {
      data.response = text;
      event('__asayer_fetch', data);
    });
    return response;
  });
}

function profiler(name) {
  return function() {
    // As decorator
    if (arguments[2] !== undefined) {
      name = name || arguments[1];
      var descriptor = arguments[2];
      var original = descriptor.value;
      if (typeof original === 'function') {
        descriptor.value = profiler(name)(original);
      }
      return descriptor;
    }

    var fn = arguments[0];
    var thisArg = arguments[1];

    if (siteID === null) {
      console.error('asayer: package was not initialized');
      return fn.bind(thisArg);
    }
    if (!browserCheck) {
      return fn.bind(thisArg);
    }

    return function() {
      var payload = {
        name: name,
        args: Array.prototype.map.call(arguments, function(arg) {
          if (typeof arg === 'object' && arg !== null) {
            if (Array.isArray(arg)) {
              return arg.toString();
            }
            var obj = {};
            for (var key in arg) {
              var value = arg[key];
              if (typeof value === 'object' && value !== null) {
                value = value.toString();
              }
              obj[key] = value;
            }
            return obj;
          }
          return arg;
        }),
      };
      payload.start_time = performance.now();
      payload.result = fn.apply(
        thisArg === undefined ? this : thisArg,
        arguments,
      );
      payload.end_time = performance.now();
      event('__asayer_profile', payload);
      return payload.result;
    };
  };
}

module.exports = module.exports.default = {
  init: init,
  vars: method(vars),
  event: method(event),
  start: method(start),
  started: method(started, false),
  id: method(id, null),
  fetch: fetch,
  profiler: profiler,
};
