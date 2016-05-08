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