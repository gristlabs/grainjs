import {assert} from 'chai';
import {min} from 'lodash';
import {PriorityQueue} from '../lib/PriorityQueue';

describe('PriorityQueue', function() {

  let seed = 1;
  function pseudoRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function removeMin<T>(array: T[]) {
    if (array.length > 0) {
      const minIdx = array.indexOf(min(array)!);
      array[minIdx] = array[array.length - 1];
      array.length--;
    }
  }

  it('should sort numbers up', function() {
    const q = new PriorityQueue((a, b) => a < b);
    [0.1, -1, 5.1, 4.2, 3.5].forEach((val) => q.push(val));
    assert.strictEqual(q.size, 5);
    assert.strictEqual(q.peek(), -1);
    assert.deepEqual([q.pop(), q.pop(), q.pop(), q.pop(), q.pop()],
      [-1, 0.1, 3.5, 4.2, 5.1]);
    assert.strictEqual(q.size, 0);
    assert.strictEqual(q.peek(), undefined);
    assert.strictEqual(q.pop(), undefined);
  });

  it('should sort numbers down', function() {
    const q = new PriorityQueue((a, b) => a > b);
    [0.1, -1, 5.1, 4.2, 3.5].forEach((val) => q.push(val));
    assert.strictEqual(q.size, 5);
    assert.strictEqual(q.peek(), 5.1);
    assert.deepEqual([q.pop(), q.pop(), q.pop(), q.pop(), q.pop()],
      [5.1, 4.2, 3.5, 0.1, -1]);
    assert.strictEqual(q.size, 0);
    assert.strictEqual(q.peek(), undefined);
    assert.strictEqual(q.pop(), undefined);
  });

  it('should work for random operations', function() {
    const q = new PriorityQueue((a, b) => a < b);
    const arr = [];
    // First fill with 1000 random numbers.
    for (let i = 0; i < 1000; i++) {
      const v = pseudoRandom();
      q.push(v);
      arr.push(v);
    }
    // Now do 2000 iterations randomly adding or removing a value.
    for (let i = 0; i < 2000; i++) {
      if (pseudoRandom() < 0.5) {
        q.pop();
        removeMin(arr);
      } else {
        const v = pseudoRandom();
        q.push(v);
        arr.push(v);
      }
    }
    assert.strictEqual(q.size, arr.length);
    arr.sort((a, b) => a - b);
    assert.deepEqual(arr.map((i) => q.pop()), arr);
    assert.strictEqual(q.size, 0);
  });
});
