"use strict";

import test from 'ava';
import {just, interval, fromEvent} from './dist/streams';

test('just factory', t => {
    just(1).subscribe(v => t.is(1, v));
    just(2).subscribe(v => t.is(2, v));
    just('123').subscribe(v => t.is('123', v));
    just([1,2,3]).subscribe(v => t.deepEqual([1,2,3], v));
});

test('interval', async t => {
    const p = new Promise((res, rej) => {
        let i = 0, s = 0;
        const sub = interval(0, 123)
            .subscribe(v => {
                s += v;
                if (++i === 3) {
                    sub();
                    setTimeout(() => i === 3 ? res(s) : rej('too many calls'), 5)
                }
            });
    });
    t.is(await p, 369);
});

test('fromEvent', t => {
    const el = {
        addEventListener: (event, clb) => {
            setTimeout(clb, 0, 1234);
        },
        removeEventListener: (event, clb) => {

        }
    };
    function test(v) {
        t.is(v, 1234);
    }
    fromEvent(el, 'event').subscribe(test)
});

test('fromEvent interval', async t => {
    const result = new Promise((res, rej) => {
        let i = 0;
        let interval = null;
        const el = {
            addEventListener: (event, clb) => {
                interval = setInterval(clb, 5, 1);
            },
            removeEventListener: (event, clb) => {
                clearInterval(interval);
            }
        };
        function test(v) {
            i += v;
        }
        const sub = fromEvent(el, 'event').subscribe(test);
        setTimeout(sub, 15);
        setTimeout(() => res(i), 20);
    });
    t.is(await result, 2);
});