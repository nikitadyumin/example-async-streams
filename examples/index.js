/**
 * Created by ndyumin on 12.03.2016.
 */
"use strict";

import stream from '../src/index';

const rand = len => () => +(Math.random() * len).toFixed(2);
const rand10 = rand(10);
const rand100 = rand(100);
const log = id => x => console.log(id, x);
function* gen(i) {
    while (i >= 0) {
        yield --i;
    }
}

stream.create(sink => {
    setTimeout(()=> sink(1));
    setTimeout(()=> sink(2));
    setTimeout(()=> sink(3));
}).map(x => x * 3).filter(x => x % 2 !== 0)
    .subscribe(log('1'));

stream.just({a: 123})
    .flatMap(v => stream.just(v.a))
    .subscribe(log('2'));

stream.fromIterable([11, 22, 33])
    .subscribe(log('3'));

stream.fromPromise(new Promise(res => setTimeout(res, 100, 456)))
    .subscribe(log('4'));

stream.fromEvent(document.querySelector('#b1'), 'click').map(rand10)
    .zip(
        stream.fromEvent(document.querySelector('#b2'), 'click').map(rand10),
        stream.fromEvent(document.querySelector('#b3'), 'click').map(rand10))
    .subscribe(log('5'));

stream.fromEvent(document.querySelector('#bb1'), 'click').map(rand100)
    .combine(
        stream.fromEvent(document.querySelector('#bb2'), 'click').map(rand100),
        stream.fromEvent(document.querySelector('#bb3'), 'click').map(rand100),
        (x, y, z) => [x, y, z])
    .subscribe(log('6'));

stream.fromIterable(gen(5))
    .subscribe(log('7.1'));

stream.fromIterable([11, 22, 33])
    .subscribe(log('7.2'));

stream.create(sink => {
    const i = setInterval(() => sink(rand100()), 1000);
    return () => clearInterval(i);
}).take(5)
    .subscribe(log('8'));

const it$ = stream.fromIterable([1, 2, 3, 4]);
it$.combine(
    it$.scan(0, (x, y) => x + y),
    (x, y)=> [x, y])
    .subscribe(log('9'));

stream.create(sink => sink(1)).startWith(0)
    .subscribe(log('10'));