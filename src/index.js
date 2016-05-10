/* @flow */
"use strict";

type Observer = (next:Next, error:Error, complete:Complete) => Subscription;
type Subscription  = () => void;
type Next<T> = (value:T) => void;
type Error<E> = (e:E) => void;
type Complete = () => void;

declare interface Observable<T> {
    subscribe: Observer;

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

declare function create(observer:Observer):Observable;
declare function just<T>(v:T):Observable<T>;
declare function fromEvent<T>(el:HTMLElement, name:string):Observable<T>;
declare function fromPromise<T>(promise:Promise):Observable<T>;
declare function fromIterable(it:Iterable):Observable;
declare function interval<T>(t:number, v:T):Observable<T>;

const noop = () => {
};

const runFn = (fn:Function):void => typeof fn === 'function' && fn();

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
            return create((next, error, complete) =>
                executor(
                    v => next(fn(v)),
                    error,
                    complete
                )
            );
        },

        filter: (predicate) => create((next, error, complete) => executor(
            v => predicate(v) ? next(v) : undefined,
            error,
            complete
        )),

        scan: function (fn, seed) {
            return create((next, error, complete) => executor(
                y => next(seed = fn(seed, y)),
                error,
                complete
            ));
        },

        reduce: function (fn, seed) {
            return create((next, error, complete) => executor(
                y => seed = fn(seed, y),
                noop,
                () => (next(seed), complete())
            ));
        },

        flatMap: function (fn) {
            return create((next, error, complete) => {
                const unsubs = [];
                unsubs[0] = executor(x => {
                    unsubs[1] = fn(x).subscribe(next);
                }, error, complete);

                return () => unsubs.forEach(runFn);
            })
        },

        startWith: v => create((next, error, complete) => {
            next(v);
            return executor(next, error, complete);
        }),

        merge: stream2 => create((next, error, complete) => {
            const unsubs = [
                executor(next, error, complete),
                stream2.subscribe(next, error, complete)
            ];
            return () => unsubs.forEach(runFn);
        }),

        take: n => create((next, error, complete) => {
            const unsub = executor(v => {
                if (--n >= 0) {
                    next(v);
                } else {
                    complete();
                    runFn(unsub);
                }
            }, error, complete);
            return unsub;
        }),

        combine: (fn, ...streams) => {
            return create(next => {
                const values = [];
                const clb = i => val => {
                    values[i] = val;
                    if (values.filter(isDefined).length === streams.length + 1) {
                        next(fn(...values));
                    }
                };
                const unsubs = [executor(clb(0))].concat(streams.map((s, i)=> s.subscribe(clb(i + 1))));
                return () => unsubs.forEach(runFn);
            });
        },

        zip: (fn, ...streams) => {
            const values = Array.from({length: streams.length + 1}, () => []);
            return create(next => {
                const clb = i => val => {
                    values[i].push(val);
                    if (values.map(first).filter(isDefined).length === streams.length + 1) {
                        next(fn(...values.map(arr => arr.shift())));
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
    return create((next, error, complete) => {
        next(v);
        runFn(complete);
        return noop;
    });
}

export function interval(t, v) {
    return create(next => {
        const i = setInterval(next, t, v);
        return () => clearInterval(i);
    });
}

export function fromEvent(el, event) {
    return create(next => {
        el.addEventListener(event, next);
        return () => el.removeEventListener(event, next);
    });
}

export function fromPromise(promise) {
    return create((next, error, complete) => {
        promise
            .then(v => (next(v), runFn(complete)))
            .catch(error);
        return () => {
        };
    })
}

export function fromIterable(iterable) {
    return create((next, error, complete) => {
        for (let v of iterable) {
            next(v);
        }
        runFn(complete);
        return noop;
    });
}