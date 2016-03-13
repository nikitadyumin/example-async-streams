/**
 * Created by ndyumin on 12.03.2016.
 */
"use strict";

const runFn = (fn, ...args) => {
    if (typeof fn === 'function') {
        fn(...args);
    }
};

const isDefined = x => typeof x !== 'undefined';
const first = x => x[0];

const stream = {
    create: function (executor) {
        return {
            subscribe: executor,

            map: fn => stream.create(sink => executor(v => sink(fn(v)))),

            flatMap: function (fn) {
                return stream.create(sink => executor(v => fn(v).subscribe(sink)));
            },

            filter: pred => stream.create(sink => executor(v => pred(v) ? sink(v) : null)),

            merge: stream2 => stream.create(sink => {
                const unsubs = [
                    executor(sink),
                    stream2.subscribe(sink)
                ];
                return () => unsubs.forEach(runFn);
            }),

            take: n => stream.create(sink => {
                const unsub = executor(v => {
                    if (--n >= 0) {
                        sink(v);
                    } else {
                        runFn(unsub);
                    }
                });
                return unsub;
            }),

            combine: (...streams) => {
                const fn = streams.pop();

                return stream.create(sink => {
                    const values = [];
                    const clb = i => val => {
                        values[i] = val;
                        if (values.filter(isDefined).length === streams.length + 1) {
                            sink(fn(...values));
                        }
                    };
                    const unsubs = [executor(clb(0))].concat(streams.map((s, i)=> s.subscribe(clb(i + 1))));
                    return () => unsubs.forEach(runFn);
                });
            },

            zip: (...streams) => {
                const values = Array.from({length: streams.length + 1}, () => []);
                return stream.create(sink => {
                    const clb = i => val => {
                        values[i].push(val);
                        if (values.map(first).filter(isDefined).length === streams.length + 1) {
                            sink(values.map(arr => arr.shift()));
                        }
                    };
                    const unsubs = [executor(clb(0))].concat(streams.map((s, i) => s.subscribe(clb(i + 1))));
                    return () => unsubs.forEach(runFn);
                });
            }
        };
    },

    just: function (v) {
        return stream.create(sink => sink(v));
    },

    fromEvent: function (el, event) {
        return stream.create(sink => {
            el.addEventListener(event, sink);
            return () => el.removeEventListener(event, sink);
        });
    },

    fromPromise: function (promise) {
        return stream.create(sink => promise.then(sink))
    },

    fromIterable: function (iterable) {
        return stream.create(sink => {
            for (let v of iterable) {
                sink(v);
            }
        });
    }
};

module.exports = stream;