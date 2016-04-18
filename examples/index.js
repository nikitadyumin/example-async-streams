/* @flow */
/**
 * Created by ndyumin on 12.03.2016.
 */
"use strict";

const {create, just, fromEvent, fromIterable, fromPromise} = require( '../dist/streams' );
const rand = len => () => +(Math.random() * len).toFixed(2);
const rand10 = rand(10);
const rand100 = rand(100);
const log = id => x => console.log(id, x);
function* gen(i) {
    while (i >= 0) {
        yield --i;
    }
}

create(sink => {
    const unsubs = [
        setTimeout(()=> sink(1)),
        setTimeout(()=> sink(2)),
        setTimeout(()=> sink(3))
    ];

    return () => unsubs.forEach(x => clearTimeout(x));
}).map(x => x * 3)
    .filter(x => x % 2 !== 0)
    .subscribe(log('1'));

just({a: 123})
    .flatMap(v => just(v.a))
    .subscribe(log('2'));

fromIterable([11, 22, 33])
    .subscribe(log('3'));

fromPromise(new Promise(res => setTimeout(res, 100, 456)))
    .subscribe(log('4'));

fromEvent(document.querySelector('#b1'), 'click').map(rand10)
    .zip(
        (x, y, z) => [x, y, z],
        fromEvent(document.querySelector('#b2'), 'click').map(rand10),
        fromEvent(document.querySelector('#b3'), 'click').map(rand10))
    .subscribe(log('5'));

fromEvent(document.querySelector('#bb1'), 'click').map(rand100)
    .combine(
        (x, y, z) => [x, y, z],
        fromEvent(document.querySelector('#bb2'), 'click').map(rand100),
        fromEvent(document.querySelector('#bb3'), 'click').map(rand100))
    .subscribe(log('6'));

fromIterable(gen(5))
    .subscribe(log('7.1'));

fromIterable([11, 22, 33])
    .subscribe(log('7.2'));

create(sink => {
    const i = setInterval(() => sink(rand100()), 1000);
    return () => clearInterval(i);
}).take(5)
    .subscribe(log('8'));

const it$ = fromIterable([1, 2, 3, 4]);
it$.combine(
    (x, y)=> [x, y],
    it$.scan((x, y) => x + y, 0))
    .subscribe(log('9'));

create(sink => {
    sink(1);
    return () => {
    };
}).startWith(0)
    .subscribe(log('10'));

const s = create((next) => {
    setTimeout(next, 100, 1);
    setTimeout(next, 200, 2);
    setTimeout(next, 300, 3);
    setTimeout(next, 400, 4);
    return () => {};
}).multicast();

s.subscribe(log('11-1'));
setTimeout(() => s.subscribe(log('11-2')), 250);
setTimeout(() => {
    const sub = s.map(v => v * 10).subscribe(log('11-3'));
    setTimeout(sub, 100);
}, 200);
