"use strict";

import test from 'ava';
import {just, interval} from './dist/streams';

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
