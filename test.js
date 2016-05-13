import test from 'ava';
import {just} from './dist/streams';


test('just factory', t => {
    just(1).subscribe(v => t.deepEqual(1, v));
    just(2).subscribe(v => t.deepEqual(2, v));
    just('123').subscribe(v => t.deepEqual('123', v));
    just([1,2,3]).subscribe(v => t.deepEqual([1,2,3], v));
});
