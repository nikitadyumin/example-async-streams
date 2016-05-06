(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	
	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.create = create;
	exports.just = just;
	exports.interval = interval;
	exports.fromEvent = fromEvent;
	exports.fromPromise = fromPromise;
	exports.fromIterable = fromIterable;

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	var noop = function noop() {};

	var runFn = function runFn(fn) {
	    return typeof fn === 'function' && fn();
	};

	function isDefined(x) {
	    return typeof x !== 'undefined';
	}

	function first(x) {
	    return x[0];
	}

	function create(executor) {
	    return {
	        subscribe: executor,

	        map: function map(fn) {
	            return create(function (sink) {
	                return executor(function (v) {
	                    return sink(fn(v));
	                });
	            });
	        },

	        filter: function filter(predicate) {
	            return create(function (sink) {
	                return executor(function (v) {
	                    return predicate(v) ? sink(v) : undefined;
	                });
	            });
	        },

	        scan: function scan(fn, seed) {
	            return create(function (sink) {
	                return executor(function (y) {
	                    return sink(seed = fn(seed, y));
	                });
	            });
	        },

	        flatMap: function flatMap(fn) {
	            return create(function (sink) {
	                var unsubs = [];
	                unsubs[0] = executor(function (x) {
	                    unsubs[1] = fn(x).subscribe(sink);
	                });

	                return function () {
	                    return unsubs.forEach(runFn);
	                };
	            });
	        },

	        startWith: function startWith(v) {
	            return create(function (sink) {
	                sink(v);
	                return executor(sink);
	            });
	        },

	        merge: function merge(stream2) {
	            return create(function (sink) {
	                var unsubs = [executor(sink), stream2.subscribe(sink)];
	                return function () {
	                    return unsubs.forEach(runFn);
	                };
	            });
	        },

	        take: function take(n) {
	            return create(function (sink) {
	                var unsub = executor(function (v) {
	                    if (--n >= 0) {
	                        sink(v);
	                    } else {
	                        runFn(unsub);
	                    }
	                });
	                return unsub;
	            });
	        },

	        combine: function combine(fn) {
	            for (var _len = arguments.length, streams = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	                streams[_key - 1] = arguments[_key];
	            }

	            return create(function (sink) {
	                var values = [];
	                var clb = function clb(i) {
	                    return function (val) {
	                        values[i] = val;
	                        if (values.filter(isDefined).length === streams.length + 1) {
	                            sink(fn.apply(undefined, values));
	                        }
	                    };
	                };
	                var unsubs = [executor(clb(0))].concat(streams.map(function (s, i) {
	                    return s.subscribe(clb(i + 1));
	                }));
	                return function () {
	                    return unsubs.forEach(runFn);
	                };
	            });
	        },

	        zip: function zip(fn) {
	            for (var _len2 = arguments.length, streams = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	                streams[_key2 - 1] = arguments[_key2];
	            }

	            var values = Array.from({ length: streams.length + 1 }, function () {
	                return [];
	            });
	            return create(function (sink) {
	                var clb = function clb(i) {
	                    return function (val) {
	                        values[i].push(val);
	                        if (values.map(first).filter(isDefined).length === streams.length + 1) {
	                            sink(fn.apply(undefined, _toConsumableArray(values.map(function (arr) {
	                                return arr.shift();
	                            }))));
	                        }
	                    };
	                };
	                var unsubs = [executor(clb(0))].concat(streams.map(function (s, i) {
	                    return s.subscribe(clb(i + 1));
	                }));
	                return function () {
	                    return unsubs.forEach(runFn);
	                };
	            });
	        },

	        multicast: function multicast() {
	            var sinks = [];
	            var started = false;

	            var broadcast = function broadcast(v) {
	                return sinks.forEach(function (fn) {
	                    return fn(v);
	                });
	            };
	            return create(function (sink) {
	                sinks.push(sink);
	                if (!started) {
	                    executor(broadcast);
	                    started = true;
	                }
	                return function () {
	                    sinks.splice(sinks.indexOf(sink), 1);
	                };
	            });
	        }
	    };
	}

	function just(v) {
	    return create(function (next, error, complete) {
	        next(v);
	        runFn(complete);
	        return noop;
	    });
	}

	function interval(t, v) {
	    return create(function (next) {
	        var i = setInterval(next, t, v);
	        return function () {
	            return clearInterval(i);
	        };
	    });
	}

	function fromEvent(el, event) {
	    return create(function (next) {
	        el.addEventListener(event, next);
	        return function () {
	            return el.removeEventListener(event, next);
	        };
	    });
	}

	function fromPromise(promise) {
	    return create(function (next, error, complete) {
	        promise.then(function (v) {
	            return next(v), runFn(complete);
	        }).catch(error);
	        return function () {};
	    });
	}

	function fromIterable(iterable) {
	    return create(function (next, error, complete) {
	        var _iteratorNormalCompletion = true;
	        var _didIteratorError = false;
	        var _iteratorError = undefined;

	        try {
	            for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                var _v = _step.value;

	                next(_v);
	            }
	        } catch (err) {
	            _didIteratorError = true;
	            _iteratorError = err;
	        } finally {
	            try {
	                if (!_iteratorNormalCompletion && _iterator.return) {
	                    _iterator.return();
	                }
	            } finally {
	                if (_didIteratorError) {
	                    throw _iteratorError;
	                }
	            }
	        }

	        runFn(complete);
	        return noop;
	    });
	}

/***/ }
/******/ ])
});
;