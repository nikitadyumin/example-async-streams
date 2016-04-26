/* @flow */
"use strict";

type Executor = (observer:Observer) => Subscription;
type Subscription  = () => void;
type Observer<T> = (value:T) => void;

declare interface Observable<T> {
    subscribe: (fn:Observer<T>) => Subscription;

    map: <U>(fn:(x:T) => U) => Observable<U>;

    filter: (predicate:(x:T) => boolean) => Observable<T>;

    scan: <U>(fn:(x:U, y:T) => U, seed:U) => Observable<U>;

    flatMap: <U>(fn:(v:T) => Observable<U>) => Observable<U>;

    startWith: (v:T) => Observable<T>;

    merge: (s:Observable<T>) => Observable<T>;

    take: (n:number) => Observable<T>;

    combine: <U>(fn:(x:T, ...xs:Array<T>) => U, ...Os:Array<Observable<T>>) => Observable<U>;

    zip: <U>(fn:(x:T, ...xs:Array<T>) => U, ...Os:Array<Observable<T>>) => Observable<U>;

    multicast: () => Observable<T>;
}

declare function create(executor:Executor):Observable;
declare function just<T>(v:T):Observable<T>;
declare function fromEvent<T>(el:HTMLElement, name:string):Observable<T>;
declare function fromPromise<T>(promise:Promise):Observable<T>;
declare function fromIterable(it:Iterable):Observable;
declare function interval<T>(t: number, v:T):Observable<T>;

const runFn = (fn:Function):void => fn();

function isDefined(x:any):boolean {
    return typeof x !== 'undefined';
}

function first<T> (x:Array<T>):T {
    return x[0];
}

export function create(executor) {
    return {
        subscribe: executor,

        map: function (fn) {
            return create(sink => executor(v => sink(fn(v))))
        },

        filter: (predicate) => create(sink => executor(v => predicate(v) ? sink(v) : undefined)),

        scan: function (fn, seed) {
            return create(sink => executor(y => sink(seed = fn(seed, y))))
        },

        flatMap: function (fn) {
            return create(sink => {
                const unsubs = [];
                unsubs[0] = executor(x => {
                    unsubs[1] = fn(x).subscribe(sink);
                });

                return () => unsubs.forEach(runFn);
            })
        },

        startWith: v => create(sink => {
            sink(v);
            return executor(sink);
        }),

        merge: stream2 => create(sink => {
            const unsubs = [
                executor(sink),
                stream2.subscribe(sink)
            ];
            return () => unsubs.forEach(runFn);
        }),

        take: n => create(sink => {
            const unsub = executor(v => {
                if (--n >= 0) {
                    sink(v);
                } else {
                    runFn(unsub);
                }
            });
            return unsub;
        }),

        combine: (fn, ...streams) => {
            return create(sink => {
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

        zip: (fn, ...streams) => {
            const values = Array.from({length: streams.length + 1}, () => []);
            return create(sink => {
                const clb = i => val => {
                    values[i].push(val);
                    if (values.map(first).filter(isDefined).length === streams.length + 1) {
                        sink(fn(...values.map(arr => arr.shift())));
                    }
                };
                const unsubs = [executor(clb(0))].concat(streams.map((s, i) => s.subscribe(clb(i + 1))));
                return () => unsubs.forEach(runFn);
            });
        },

        multicast: () => {
            const sinks = [];
            let started = false;

            const broadcast = v => sinks.forEach(fn => fn(v));
            return create(sink => {
                sinks.push(sink);
                if (!started) {
                    executor(broadcast);
                    started = true;
                }
                return () => {
                    sinks.splice(sinks.indexOf(sink), 1);
                };
            });
        }
    };
}

export function just(v) {
    return create(sink => {
        sink(v);
        return () => {
        };
    });
}

export function interval(t, v) {
    return create(sink => {
        const i = setInterval(sink, t, v);
        return () => clearInterval(i);
    });
}

export function fromEvent(el, event) {
    return create(sink => {
        el.addEventListener(event, sink);
        return () => el.removeEventListener(event, sink);
    });
}

export function fromPromise(promise) {
    return create(sink => {
        promise.then(sink);
        return () => {
        };
    })
}

export function fromIterable(iterable) {
    return create(sink => {
        for (let v of iterable) {
            sink(v);
        }
        return () => {
        };
    });
}