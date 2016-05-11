type Observer = (next:Next, error: Error, complete: Complete) => Subscription;
type Subscription  = () => void;
type Next<T> = (value:T) => void;
type Error<E> = (e:E) => void;
type Complete = () => void;

Observable methods
```
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
```
factories
```
declare function create(observer:Observer):Observable;
declare function just<T>(v:T):Observable<T>;
declare function fromEvent<T>(el:HTMLElement, name:string):Observable<T>;
declare function fromPromise<T>(promise:Promise):Observable<T>;
declare function fromIterable(it:Iterable):Observable;
declare function interval<T>(t: number, v:T):Observable<T>;
```

Examples
```javascript
const noop = () => {};
stream.create(sink => {
    sink(1);
    sink(2);
    sink(3);
    return noop;
}).map(x=>x)
    .flatMap(x => stream.just(1))
    .filter(x =>    x)
    .scan((x, y) => x + y, true)
    .subscribe(v=> console.log(v));

stream.just(1).merge(stream.just(2), stream.just(3), stream.just(4))
    .subscribe(v=> console.log(v));

stream.just(1).combine((a, b, c, d) => [a, b, c, d], stream.just(2), stream.just(3), stream.just(4))
    .subscribe(v=> console.log(v));

stream.just(1).zip((a, b, c) => [a, b, c], stream.just('2'), stream.just(3))
    .subscribe(v=> console.log(v));

stream.just(1).filter(x => x).subscribe(noop);
```