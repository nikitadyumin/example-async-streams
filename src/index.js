/* @flow */
/**
 * Created by ndyumin on 12.03.2016.
 */

"use strict";
declare interface Observable<T> {
subscribe (observer:Observer): Subscription;

map<U> (fn:(x:T) => U): Observable<U>;

filter (predicate: (x: T) => boolean): Observable<T>;

scan<U> (seed:U, fn:(x:U, y:T) => U): Observable<U>;

flatMap<U> (fn:(x:T) => Observable<U>): Observable<U>;
}

declare interface ObservableModule<T> {
create (executor:Executor): Observable<T>;

just (value:T): Observable<T>;

fromEvent (el:DomEventEmitter, name:string): Observable;

fromPromise (p:Promise): Observable;

fromIterable (it:Iterable): Observable;
}

type DomEventEmitter = {
    addEventListener (name:string, listener:Function) : void;
    removeEventListener (name:string, listener:Function) : void;
}

type Executor = (observer:Observer) => Subscription;
type Subscription  = () => void;
type Observer = (value:any) => void;

const runFn = (fn:Function):void => fn();

function isDefined(x:any):boolean {
    return typeof x !== 'undefined';
}

function first<T> (x:Array<T>):T {
    return x[0];
}

const stream:ObservableModule = {
    create: function<T>(executor):Observable<T> {
        return {
            subscribe: executor,

            map: fn => stream.create(sink => executor(v => sink(fn(v)))),

            filter: function(predicate: (x: T) => boolean): Observable<T> {
                return stream.create(sink => executor(v => predicate(v) ? sink(v) : undefined))
            },

            scan: function<U>(seed:U, fn:(x:U, y:T) => U) {
                return stream.create(sink => executor(y => sink(seed = fn(seed, y))));
            },

            flatMap: function<U> (fn:(x:T) => Observable<U>):Observable<U> {
                return stream.create(sink => {
                    const unsubs = [];
                    unsubs[0] = executor(x => {
                        unsubs[1] = fn(x).subscribe(sink);
                    });

                    return () => unsubs.forEach(runFn);
                })
            },

            startWith: v => stream.create(sink => {
                sink(v);
                return executor(v => sink(v));
            }),

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
        return stream.create(sink => {
            sink(v);
            return () => {
            };
        });
    },

    fromEvent: function (el, event) {
        return stream.create(sink => {
            el.addEventListener(event, sink);
            return () => el.removeEventListener(event, sink);
        });
    },

    fromPromise: function (promise) {
        return stream.create(sink => {
            promise.then(sink);
            return () => {
            };
        })
    },

    fromIterable: function (iterable) {
        return stream.create(sink => {
            for (let v of iterable) {
                sink(v);
            }
            return () => {
            };
        });
    }
};

export default stream;